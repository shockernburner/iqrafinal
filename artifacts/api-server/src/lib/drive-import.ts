import { randomUUID } from "node:crypto";
import { storeKnowledgeUpload } from "./knowledge-upload";

/**
 * Google Drive folder import.
 *
 * Works with publicly shared ("anyone with the link") folders: the folder tree is
 * read via Drive's public embedded folder view and files are downloaded one at a
 * time via the public download endpoint. Each file goes through the standard
 * knowledge upload pipeline (validation, sha256 dedupe, ingestion job), so
 * indexing and post-index original deletion behave exactly like manual uploads.
 *
 * Runs as a single in-process background job with live progress. Only one import
 * can run at a time.
 */

const SUPPORTED_EXTENSIONS = new Set(["pdf", "docx", "txt", "html"]);
const MAX_FILE_BYTES = Number(process.env.MAX_KNOWLEDGE_UPLOAD_BYTES ?? 50 * 1024 * 1024);
const MAX_FOLDER_DEPTH = 6;
const MAX_TOTAL_FILES = 100_000;
const RECENT_RESULTS_CAP = 50;

type DriveEntry = { id: string; name: string; isFolder: boolean };

export type DriveImportResult = {
  fileName: string;
  outcome: "imported" | "duplicate" | "skipped" | "failed";
  detail: string | null;
};

export type DriveImportJob = {
  id: string;
  folderUrl: string;
  status: "scanning" | "running" | "succeeded" | "failed" | "cancelled";
  startedAt: string;
  finishedAt: string | null;
  totalFiles: number;
  processed: number;
  imported: number;
  duplicates: number;
  skipped: number;
  failed: number;
  currentFile: string | null;
  recentResults: DriveImportResult[];
  error: string | null;
};

const state: { job: DriveImportJob | null; cancelRequested: boolean } = {
  job: null,
  cancelRequested: false,
};

export function parseDriveFolderUrl(url: string): string | null {
  const m =
    url.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([\w-]{10,})/) ||
    url.match(/[?&]id=([\w-]{10,})/);
  return m ? m[1]! : null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

async function listPublicFolder(folderId: string): Promise<DriveEntry[]> {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}#list`);
  if (!res.ok) {
    throw new Error(`Drive folder listing failed (HTTP ${res.status}). Is the folder shared as "anyone with the link"?`);
  }
  const html = await res.text();
  const blocks = html.split('class="flip-entry"').slice(1);
  const entries: DriveEntry[] = [];
  for (const block of blocks) {
    const id = block.match(/id="entry-([\w-]+)"/)?.[1];
    const href = block.match(/href="([^"]+)"/)?.[1] ?? "";
    const name = block.match(/flip-entry-title">([^<]+)</)?.[1];
    if (!id || !name) continue;
    entries.push({ id, name: decodeHtmlEntities(name), isFolder: href.includes("/drive/folders/") });
  }
  return entries;
}

/** Recursively collect all files under a folder (depth-first, stable order). */
async function collectFiles(
  folderId: string,
  depth: number,
  out: Array<{ id: string; name: string }>,
  limits: { truncated: boolean },
): Promise<void> {
  if (state.cancelRequested) return;
  if (depth > MAX_FOLDER_DEPTH || out.length >= MAX_TOTAL_FILES) {
    limits.truncated = true;
    return;
  }
  const entries = await listPublicFolder(folderId);
  for (const entry of entries) {
    if (state.cancelRequested) return;
    if (out.length >= MAX_TOTAL_FILES) {
      limits.truncated = true;
      return;
    }
    if (entry.isFolder) {
      await collectFiles(entry.id, depth + 1, out, limits);
    } else {
      out.push({ id: entry.id, name: entry.name });
    }
  }
}

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  html: "text/html",
};

/** Hosts the virus-scan confirm form is allowed to point at. Anything else is rejected (SSRF guard). */
const ALLOWED_DOWNLOAD_HOSTS = new Set(["drive.google.com", "drive.usercontent.google.com", "docs.google.com"]);

async function downloadPublicFile(fileId: string, extension: string): Promise<Buffer> {
  let res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, { redirect: "follow" });
  let contentType = res.headers.get("content-type") ?? "";
  if (res.ok && contentType.includes("text/html")) {
    const page = await res.text();
    // Drive serves a virus-scan interstitial for larger files. Detect it explicitly:
    // it contains a download form whose action targets a Google download host.
    const action = page.match(/<form[^>]+action="([^"]+)"/)?.[1];
    let confirmUrl: URL | null = null;
    if (action) {
      try {
        confirmUrl = new URL(action, "https://drive.google.com");
      } catch {
        confirmUrl = null;
      }
    }
    if (!confirmUrl || confirmUrl.protocol !== "https:" || !ALLOWED_DOWNLOAD_HOSTS.has(confirmUrl.hostname)) {
      if (extension === "html") {
        // The file itself is an HTML document — treat the body as content.
        return Buffer.from(page, "utf-8");
      }
      throw new Error("Drive returned an HTML page instead of the file (not public or quota exceeded).");
    }
    for (const m of page.matchAll(/name="([^"]+)" value="([^"]*)"/g)) {
      confirmUrl.searchParams.set(m[1]!, m[2]!);
    }
    res = await fetch(confirmUrl.toString(), { redirect: "follow" });
    contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/html") && extension !== "html") {
      throw new Error("Drive did not serve the file content (download quota may be exceeded).");
    }
  }
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}).`);
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_FILE_BYTES) throw new Error("File exceeds the per-file size limit.");
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_FILE_BYTES) throw new Error("File exceeds the per-file size limit.");
  return buffer;
}

function recordResult(job: DriveImportJob, result: DriveImportResult) {
  job.processed += 1;
  if (result.outcome === "imported") job.imported += 1;
  else if (result.outcome === "duplicate") job.duplicates += 1;
  else if (result.outcome === "skipped") job.skipped += 1;
  else job.failed += 1;
  job.recentResults = [result, ...job.recentResults].slice(0, RECENT_RESULTS_CAP);
}

async function executeImport(job: DriveImportJob, folderId: string, userId: string) {
  try {
    const files: Array<{ id: string; name: string }> = [];
    const limits = { truncated: false };
    await collectFiles(folderId, 0, files, limits);
    if (state.cancelRequested) {
      job.status = "cancelled";
      return;
    }
    job.totalFiles = files.length;
    job.status = "running";
    if (limits.truncated) {
      job.error = `Folder scan hit a limit (max ${MAX_TOTAL_FILES} files, ${MAX_FOLDER_DEPTH} levels deep); importing the ${files.length} files found. Run the import again for the rest.`;
    }
    if (files.length === 0) {
      throw new Error("No files found. Check that the folder is shared as \"anyone with the link\".");
    }

    for (const file of files) {
      if (state.cancelRequested) {
        job.status = "cancelled";
        break;
      }
      job.currentFile = file.name;
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!SUPPORTED_EXTENSIONS.has(extension)) {
        recordResult(job, { fileName: file.name, outcome: "skipped", detail: "Unsupported file type." });
        continue;
      }
      try {
        const buffer = await downloadPublicFile(file.id, extension);
        const uploadResult = await storeKnowledgeUpload(
          {
            originalname: file.name,
            mimetype: MIME_BY_EXTENSION[extension] ?? "application/octet-stream",
            size: buffer.byteLength,
            buffer,
          } as Express.Multer.File,
          userId,
        );
        if ("error" in uploadResult) {
          recordResult(job, {
            fileName: file.name,
            outcome: uploadResult.status === 409 ? "duplicate" : "failed",
            detail: uploadResult.error ?? null,
          });
        } else {
          recordResult(job, { fileName: file.name, outcome: "imported", detail: null });
        }
      } catch (error) {
        recordResult(job, {
          fileName: file.name,
          outcome: "failed",
          detail: error instanceof Error ? error.message : "Unexpected error.",
        });
      }
    }

    if (job.status !== "cancelled") job.status = "succeeded";
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Import failed.";
  } finally {
    job.currentFile = null;
    job.finishedAt = new Date().toISOString();
    state.cancelRequested = false;
  }
}

export function getDriveImportStatus(): DriveImportJob | null {
  return state.job;
}

export function cancelDriveImport(): boolean {
  if (!state.job || state.job.finishedAt) return false;
  state.cancelRequested = true;
  return true;
}

export function startDriveImport(folderUrl: string, userId: string) {
  if (state.job && !state.job.finishedAt) {
    return { started: false as const, job: state.job };
  }
  const folderId = parseDriveFolderUrl(folderUrl);
  if (!folderId) {
    return { started: false as const, invalidUrl: true as const, job: null };
  }
  const job: DriveImportJob = {
    id: randomUUID(),
    folderUrl,
    status: "scanning",
    startedAt: new Date().toISOString(),
    finishedAt: null,
    totalFiles: 0,
    processed: 0,
    imported: 0,
    duplicates: 0,
    skipped: 0,
    failed: 0,
    currentFile: null,
    recentResults: [],
    error: null,
  };
  state.job = job;
  state.cancelRequested = false;
  void executeImport(job, folderId, userId);
  return { started: true as const, job };
}
