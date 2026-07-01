import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { query } from "@/lib/db";

const repoRoot = path.resolve(process.cwd(), "..");
const knowledgeRoot = path.join(repoRoot, "IQRA - all final", "Knowledge base- 428 nos");

type SourceVersion = {
  original_filename: string;
  mime_type: string;
  storage_key: string;
};

function getStorageRoot() {
  const configuredStorageRoot = process.env.KNOWLEDGE_STORAGE_DIR;
  return configuredStorageRoot
    ? path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredStorageRoot)
    : path.join(process.cwd(), "storage", "knowledge");
}

async function streamUploadedSource(requestedPath: string) {
  if (!process.env.DATABASE_URL) return null;
  const result = await query<SourceVersion>(
    `SELECT original_filename, mime_type, storage_key
     FROM document_versions
     WHERE storage_key = $1 AND status <> 'deleted'
     LIMIT 1`,
    [requestedPath],
  );
  const source = result.rows[0];
  if (!source) return null;
  const absolutePath = path.resolve(getStorageRoot(), source.storage_key);
  if (!absolutePath.startsWith(getStorageRoot())) return null;
  const file = await readFile(absolutePath);
  return new NextResponse(file, {
    headers: {
      "Content-Type": source.mime_type,
      "Content-Disposition": `inline; filename="${source.original_filename.replace(/"/g, "")}"`,
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const requestedPath = request.nextUrl.searchParams.get("path");
  if (!requestedPath) {
    return NextResponse.json({ error: "Source path is required." }, { status: 400 });
  }

  try {
    const uploadedSource = await streamUploadedSource(requestedPath);
    if (uploadedSource) return uploadedSource;
  } catch {
    return NextResponse.json({ error: "Source could not be opened." }, { status: 404 });
  }

  const absolutePath = path.resolve(repoRoot, requestedPath);
  if (!absolutePath.startsWith(knowledgeRoot) || !absolutePath.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Source is not available." }, { status: 404 });
  }

  try {
    const file = await readFile(absolutePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${path.basename(absolutePath).replace(/"/g, "")}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Source could not be opened." }, { status: 404 });
  }
}