/**
 * Integration tests for the Drive folder import pipeline.
 *
 * All network calls are intercepted via a mock `fetch`. The `storeKnowledgeUpload`
 * function is fully mocked so no database or object-storage connections are needed.
 * Fake timers let rate-limit back-offs complete instantly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Module mock (hoisted by vitest) ───────────────────────────────────────────
vi.mock("../knowledge-upload.js", () => ({
  storeKnowledgeUpload: vi.fn(),
}));

import {
  startDriveImport,
  getDriveImportStatus,
  cancelDriveImport,
  type DriveImportJob,
} from "../drive-import.js";
import { storeKnowledgeUpload } from "../knowledge-upload.js";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const FOLDER_ID = "test-folder-abc123";
const FOLDER_URL = `https://drive.google.com/drive/folders/${FOLDER_ID}`;

/** Build the HTML snippet that listPublicFolder parses. */
function buildFolderHtml(
  files: Array<{ id: string; name: string }>,
  folders: Array<{ id: string; name: string }> = [],
): string {
  const fileBlocks = files.map(
    (f) =>
      `class="flip-entry" id="entry-${f.id}" href="https://drive.google.com/file/d/${f.id}/view">` +
      `<span class="flip-entry-title">${f.name}</span>`,
  );
  const folderBlocks = folders.map(
    (f) =>
      `class="flip-entry" id="entry-${f.id}" href="https://drive.google.com/drive/folders/${f.id}">` +
      `<span class="flip-entry-title">${f.name}</span>`,
  );
  return [...fileBlocks, ...folderBlocks].join(" PREFIX ");
}

/** Minimal Response-like object for successful file downloads. */
function makeFileResponse(bytes = 512): Response {
  const buf = new Uint8Array(bytes).buffer;
  return {
    ok: true,
    status: 200,
    headers: new Headers({
      "content-type": "application/pdf",
      "content-length": String(bytes),
    }),
    arrayBuffer: () => Promise.resolve(buf),
    text: () => Promise.resolve(""),
  } as unknown as Response;
}

/** Minimal Response-like object for folder listing. */
function makeFolderResponse(html: string): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "text/html" }),
    text: () => Promise.resolve(html),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as unknown as Response;
}

/** Rate-limit response (HTTP 429). */
function make429Response(): Response {
  return {
    ok: false,
    status: 429,
    headers: new Headers({}),
    text: () => Promise.resolve(""),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  } as unknown as Response;
}

/** Build an array of N file descriptors. */
function makeFiles(n: number): Array<{ id: string; name: string }> {
  return Array.from({ length: n }, (_, i) => ({
    id: `file-${String(i + 1).padStart(2, "0")}`,
    name: `doc-${String(i + 1).padStart(2, "0")}.pdf`,
  }));
}

/** Advance fake timers in 200 ms increments until the job reaches a terminal state. */
async function waitForTerminal(timeoutMs = 30_000): Promise<DriveImportJob> {
  const steps = Math.ceil(timeoutMs / 200);
  for (let i = 0; i < steps; i++) {
    await vi.advanceTimersByTimeAsync(200);
    const job = getDriveImportStatus();
    if (job?.finishedAt) return job;
  }
  throw new Error(
    `Job did not terminate within ${timeoutMs} ms (last status: ${getDriveImportStatus()?.status})`,
  );
}

/** Default storeKnowledgeUpload mock: every upload succeeds. */
function mockStoreSuccess() {
  vi.mocked(storeKnowledgeUpload).mockResolvedValue({
    documentId: "doc-id",
    versionId: "ver-id",
    jobId: "job-id",
    sha256: "abc123",
    ingestionStatus: "queued",
  } as const);
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(storeKnowledgeUpload).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Drive import pipeline", () => {
  it("imports 20 files and correctly increments progress counters", async () => {
    const files = makeFiles(20);
    const folderHtml = buildFolderHtml(files);

    // Files 3, 7 and 13 (1-based index) trigger one 429 before succeeding.
    const rateLimitedIds = new Set(["file-03", "file-07", "file-13"]);
    const attempts = new Map<string, number>();

    vi.stubGlobal("fetch", (url: string) => {
      const urlStr = String(url);

      if (urlStr.includes("embeddedfolderview")) {
        return Promise.resolve(makeFolderResponse(folderHtml));
      }

      if (urlStr.includes("uc?export=download")) {
        const fileId = new URL(urlStr).searchParams.get("id") ?? "";
        const attempt = attempts.get(fileId) ?? 0;
        attempts.set(fileId, attempt + 1);

        if (rateLimitedIds.has(fileId) && attempt === 0) {
          return Promise.resolve(make429Response());
        }
        return Promise.resolve(makeFileResponse());
      }

      return Promise.reject(new Error(`Unexpected fetch: ${urlStr}`));
    });

    mockStoreSuccess();

    const { started, job } = startDriveImport(FOLDER_URL, "user-1");
    expect(started).toBe(true);
    expect(job).not.toBeNull();

    const finished = await waitForTerminal();

    expect(finished.status).toBe("succeeded");
    expect(finished.totalFiles).toBe(20);
    expect(finished.processed).toBe(20);
    // All files are PDFs and storeKnowledgeUpload succeeds for every one.
    expect(finished.imported).toBe(20);
    expect(finished.duplicates).toBe(0);
    expect(finished.skipped).toBe(0);
    expect(finished.failed).toBe(0);
    expect(finished.finishedAt).not.toBeNull();
    expect(finished.currentFile).toBeNull();

    // The three rate-limited files each needed 2 fetch calls.
    for (const id of rateLimitedIds) {
      expect(attempts.get(id)).toBe(2);
    }
  });

  it("classifies skips, duplicates, and failures in progress counters", async () => {
    // 10 files: 4 PDFs, 3 .docx duplicates, 2 unsupported (.zip), 1 that 404s on download.
    const pdfFiles = [
      { id: "ok-01", name: "ok-01.pdf" },
      { id: "ok-02", name: "ok-02.pdf" },
      { id: "ok-03", name: "ok-03.pdf" },
      { id: "ok-04", name: "ok-04.pdf" },
    ];
    const docxDups = [
      { id: "dup-01", name: "dup-01.docx" },
      { id: "dup-02", name: "dup-02.docx" },
      { id: "dup-03", name: "dup-03.docx" },
    ];
    const zipFiles = [
      { id: "zip-01", name: "archive-01.zip" },
      { id: "zip-02", name: "archive-02.zip" },
    ];
    const failFile = { id: "fail-01", name: "broken-01.pdf" };

    const allFiles = [...pdfFiles, ...docxDups, ...zipFiles, failFile];
    const folderHtml = buildFolderHtml(allFiles);

    vi.stubGlobal("fetch", (url: string) => {
      const urlStr = String(url);
      if (urlStr.includes("embeddedfolderview")) {
        return Promise.resolve(makeFolderResponse(folderHtml));
      }
      if (urlStr.includes("uc?export=download")) {
        const fileId = new URL(urlStr).searchParams.get("id") ?? "";
        if (fileId === "fail-01") {
          return Promise.resolve({
            ok: false,
            status: 404,
            headers: new Headers({}),
            text: () => Promise.resolve(""),
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          } as unknown as Response);
        }
        return Promise.resolve(makeFileResponse());
      }
      return Promise.reject(new Error(`Unexpected fetch: ${urlStr}`));
    });

    // PDFs succeed; docx files return a duplicate error.
    vi.mocked(storeKnowledgeUpload).mockImplementation(async (file) => {
      if (file.originalname.endsWith(".docx")) {
        return { error: "Duplicate upload. Existing version: dup-01.docx", status: 409 } as const;
      }
      return {
        documentId: "doc-id",
        versionId: "ver-id",
        jobId: "job-id",
        sha256: "abc",
        ingestionStatus: "queued",
      } as const;
    });

    const { started } = startDriveImport(FOLDER_URL, "user-2");
    expect(started).toBe(true);

    const finished = await waitForTerminal();

    expect(finished.status).toBe("succeeded");
    expect(finished.totalFiles).toBe(10);
    expect(finished.processed).toBe(10);
    expect(finished.imported).toBe(4);    // pdfFiles
    expect(finished.duplicates).toBe(3); // docxDups
    expect(finished.skipped).toBe(2);    // zipFiles (unsupported extension)
    expect(finished.failed).toBe(1);     // failFile (404)
  });

  it("leaves the job in 'cancelled' state with accurate counts when cancelled mid-import", async () => {
    // 20 files; each download takes 50 ms (fake time) so we can cancel before all complete.
    const files = makeFiles(20);
    const folderHtml = buildFolderHtml(files);

    vi.stubGlobal("fetch", (url: string) => {
      const urlStr = String(url);
      if (urlStr.includes("embeddedfolderview")) {
        return Promise.resolve(makeFolderResponse(folderHtml));
      }
      if (urlStr.includes("uc?export=download")) {
        // Simulate a 50 ms download latency so the pipeline doesn't finish instantly.
        return new Promise<Response>((resolve) =>
          setTimeout(() => resolve(makeFileResponse()), 50),
        );
      }
      return Promise.reject(new Error(`Unexpected fetch: ${urlStr}`));
    });

    mockStoreSuccess();

    const { started, job } = startDriveImport(FOLDER_URL, "user-3");
    expect(started).toBe(true);

    // Let scanning complete and the first download batch start (> 0 ms, < 50 ms).
    await vi.advanceTimersByTimeAsync(10);

    // Cancel before any download finishes.
    const cancelled = cancelDriveImport();
    expect(cancelled).toBe(true);

    // Drain remaining timers until the job settles.
    const finished = await waitForTerminal();

    expect(finished.status).toBe("cancelled");
    expect(finished.finishedAt).not.toBeNull();
    // Fewer than 20 files were processed.
    expect(finished.processed).toBeLessThan(20);
    // Counters are internally consistent.
    expect(finished.imported + finished.duplicates + finished.skipped + finished.failed).toBe(
      finished.processed,
    );
    // The job object returned by startDriveImport is updated in place.
    expect(job!.status).toBe("cancelled");
  });

  it("reports 'failed' when the folder URL is valid but the folder is empty", async () => {
    const emptyFolderHtml = ""; // no flip-entry blocks → 0 files

    vi.stubGlobal("fetch", (url: string) => {
      const urlStr = String(url);
      if (urlStr.includes("embeddedfolderview")) {
        return Promise.resolve(makeFolderResponse(emptyFolderHtml));
      }
      return Promise.reject(new Error(`Unexpected fetch: ${urlStr}`));
    });

    vi.mocked(storeKnowledgeUpload).mockReset();

    const { started } = startDriveImport(FOLDER_URL, "user-4");
    expect(started).toBe(true);

    const finished = await waitForTerminal();

    expect(finished.status).toBe("failed");
    expect(finished.error).toMatch(/no files found/i);
    expect(finished.processed).toBe(0);
  });

  it("refuses to start a second import while one is already running", async () => {
    // First job: downloads take 50 ms so it stays in flight.
    const files = makeFiles(5);
    const folderHtml = buildFolderHtml(files);

    vi.stubGlobal("fetch", (url: string) => {
      const urlStr = String(url);
      if (urlStr.includes("embeddedfolderview")) {
        return Promise.resolve(makeFolderResponse(folderHtml));
      }
      return new Promise<Response>((resolve) =>
        setTimeout(() => resolve(makeFileResponse()), 50),
      );
    });
    mockStoreSuccess();

    const first = startDriveImport(FOLDER_URL, "user-5");
    expect(first.started).toBe(true);

    // Attempt to start a second while the first is still running.
    const second = startDriveImport(FOLDER_URL, "user-5");
    expect(second.started).toBe(false);

    // Clean up: let the first job finish.
    await waitForTerminal();
  });
});

// ─── Status shape tests ───────────────────────────────────────────────────────
//
// These tests verify that getDriveImportStatus() — which is returned verbatim by
// GET /api/admin/documents/import-drive — produces the exact JSON shape the
// frontend polling loop expects at every stage of an import.  A mismatch between
// field names / nullability here would silently break the progress display.
//
// The shape contract mirrors the GetAdminDriveImportResponse Zod schema in
// @workspace/api-zod, which defines the wire format.

describe("Drive import status shape (GET /api/admin/documents/import-drive)", () => {
  /**
   * Assert every field the frontend reads off a DriveImportJob.
   * Validates types and nullability rules, not specific values.
   */
  function assertJobShape(job: DriveImportJob) {
    // Identity
    expect(typeof job.id).toBe("string");
    expect(job.id.length).toBeGreaterThan(0);

    // Source URL
    expect(typeof job.folderUrl).toBe("string");

    // Status is one of the documented enum values
    expect(["scanning", "running", "succeeded", "failed", "cancelled"]).toContain(job.status);

    // Timestamps
    expect(typeof job.startedAt).toBe("string");
    // finishedAt is null while running, ISO string when done
    expect(job.finishedAt === null || typeof job.finishedAt === "string").toBe(true);

    // Counters are all non-negative integers
    for (const field of ["totalFiles", "processed", "imported", "duplicates", "skipped", "failed"] as const) {
      expect(typeof job[field]).toBe("number");
      expect(Number.isInteger(job[field])).toBe(true);
      expect(job[field]).toBeGreaterThanOrEqual(0);
    }

    // Counters must be internally consistent: sum of outcomes === processed
    expect(job.imported + job.duplicates + job.skipped + job.failed).toBe(job.processed);

    // currentFile is null or a non-empty string
    expect(job.currentFile === null || typeof job.currentFile === "string").toBe(true);

    // recentResults is an array with the correct item shape
    expect(Array.isArray(job.recentResults)).toBe(true);
    for (const result of job.recentResults) {
      expect(typeof result.fileName).toBe("string");
      expect(["imported", "duplicate", "skipped", "failed"]).toContain(result.outcome);
      expect(result.detail === null || typeof result.detail === "string").toBe(true);
    }

    // error is null or a string
    expect(job.error === null || typeof job.error === "string").toBe(true);
  }

  it("returns the running shape while a large import is in progress, then the succeeded shape when done", async () => {
    // 8 files; each download resolves after 50 ms of fake time so the import
    // stays in the "running" state long enough for us to sample it mid-flight.
    const files = makeFiles(8);
    const folderHtml = buildFolderHtml(files);

    vi.stubGlobal("fetch", (url: string) => {
      const urlStr = String(url);
      if (urlStr.includes("embeddedfolderview")) {
        return Promise.resolve(makeFolderResponse(folderHtml));
      }
      if (urlStr.includes("uc?export=download")) {
        return new Promise<Response>((resolve) =>
          setTimeout(() => resolve(makeFileResponse()), 50),
        );
      }
      return Promise.reject(new Error(`Unexpected fetch: ${urlStr}`));
    });

    mockStoreSuccess();

    const { started } = startDriveImport(FOLDER_URL, "user-shape-1");
    expect(started).toBe(true);

    // Advance past one full download cycle (> 50 ms) so at least one file has
    // been processed and the counters are non-zero, while several downloads are
    // still in flight (8 files total, concurrency 4, each 50 ms).
    await vi.advanceTimersByTimeAsync(60);

    // ── Mid-import snapshot ──────────────────────────────────────────────────
    const midJob = getDriveImportStatus();
    expect(midJob).not.toBeNull();

    // At least one file must have completed by the 60 ms mark.
    expect(midJob!.processed).toBeGreaterThan(0);
    // The job is still running — not all 8 files are done yet.
    expect(midJob!.status).toBe("running");
    // finishedAt is null — the job is not done yet.
    expect(midJob!.finishedAt).toBeNull();
    // The full shape contract is satisfied.
    assertJobShape(midJob!);

    // ── Wait for completion ──────────────────────────────────────────────────
    const finished = await waitForTerminal();

    // Terminal state
    expect(finished.status).toBe("succeeded");

    // All files must be accounted for
    expect(finished.totalFiles).toBe(8);
    expect(finished.processed).toBe(8);
    expect(finished.imported).toBe(8);

    // finishedAt is now a non-null ISO timestamp
    expect(finished.finishedAt).not.toBeNull();
    expect(typeof finished.finishedAt).toBe("string");

    // currentFile is cleared once the job finishes
    expect(finished.currentFile).toBeNull();

    // recentResults holds up to RECENT_RESULTS_CAP entries, newest first,
    // each with the correct shape.
    expect(finished.recentResults.length).toBeGreaterThan(0);
    expect(finished.recentResults.length).toBeLessThanOrEqual(8);
    for (const result of finished.recentResults) {
      expect(result.outcome).toBe("imported");
      expect(typeof result.fileName).toBe("string");
      expect(result.fileName.endsWith(".pdf")).toBe(true);
      expect(result.detail).toBeNull();
    }

    // No error on a clean run
    expect(finished.error).toBeNull();

    // Full shape contract is satisfied for the completed job too
    assertJobShape(finished);
  });

  it("mid-import status includes partial counters that add up correctly", async () => {
    // Mix of outcomes: 3 PDFs (will succeed), 2 .zip (will be skipped), 1 PDF
    // that returns a duplicate error.
    const successFiles = makeFiles(3);
    const zipFiles = [
      { id: "zip-s1", name: "data-01.zip" },
      { id: "zip-s2", name: "data-02.zip" },
    ];
    const dupFile = { id: "dup-s1", name: "dup-s1.pdf" };
    const allFiles = [...successFiles, ...zipFiles, dupFile];
    const folderHtml = buildFolderHtml(allFiles);

    vi.stubGlobal("fetch", (url: string) => {
      const urlStr = String(url);
      if (urlStr.includes("embeddedfolderview")) {
        return Promise.resolve(makeFolderResponse(folderHtml));
      }
      if (urlStr.includes("uc?export=download")) {
        // Slow downloads so we can sample mid-run.
        return new Promise<Response>((resolve) =>
          setTimeout(() => resolve(makeFileResponse()), 50),
        );
      }
      return Promise.reject(new Error(`Unexpected fetch: ${urlStr}`));
    });

    vi.mocked(storeKnowledgeUpload).mockImplementation(async (file) => {
      if (file.originalname === "dup-s1.pdf") {
        return { error: "Duplicate upload. Existing version: dup-s1.pdf", status: 409 } as const;
      }
      return {
        documentId: "doc-id",
        versionId: "ver-id",
        jobId: "job-id",
        sha256: "abc",
        ingestionStatus: "queued",
      } as const;
    });

    const { started } = startDriveImport(FOLDER_URL, "user-shape-2");
    expect(started).toBe(true);

    // Advance past one download cycle (> 50 ms) so at least one file has
    // finished being stored and the processed counter is non-zero.
    await vi.advanceTimersByTimeAsync(60);

    const midJob = getDriveImportStatus();
    expect(midJob).not.toBeNull();
    // At least one file must have been processed by the 60 ms mark.
    expect(midJob!.processed).toBeGreaterThan(0);
    // Shape must be valid with non-zero partial progress.
    assertJobShape(midJob!);

    // Drain the import.
    const finished = await waitForTerminal();

    expect(finished.status).toBe("succeeded");
    expect(finished.totalFiles).toBe(6);
    expect(finished.processed).toBe(6);
    expect(finished.imported).toBe(3);   // successFiles
    expect(finished.duplicates).toBe(1); // dupFile
    expect(finished.skipped).toBe(2);    // zipFiles (unsupported extension)
    expect(finished.failed).toBe(0);

    // Shape contract holds for the final state too.
    assertJobShape(finished);
  });
});
