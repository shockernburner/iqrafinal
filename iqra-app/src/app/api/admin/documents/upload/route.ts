import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/authz";
import { storeKnowledgeUpload } from "@/lib/knowledge-upload";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access is required." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF, DOCX, TXT, or HTML file is required." }, { status: 400 });
  }

  try {
    const result = await storeKnowledgeUpload(file, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Upload failed before indexing could be queued." }, { status: 503 });
  }
}
