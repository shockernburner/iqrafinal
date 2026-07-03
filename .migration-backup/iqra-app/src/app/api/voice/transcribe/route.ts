import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { transcribeWithLocalStt } from "@/lib/model/stt";
import { rateLimit } from "@/lib/rate-limit";

const maxAudioBytes = Number(process.env.MAX_VOICE_UPLOAD_BYTES ?? 12 * 1024 * 1024);
const allowedAudioTypes = new Set(["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav"]);

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { scope: "voice", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const form = await request.formData();
  const audio = form.get("audio");

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
  }

  if (audio.size > maxAudioBytes) {
    return NextResponse.json({ error: "Audio file is too large." }, { status: 413 });
  }

  if (!allowedAudioTypes.has(audio.type)) {
    return NextResponse.json({ error: "Unsupported audio format." }, { status: 415 });
  }

  try {
    return NextResponse.json(await transcribeWithLocalStt(audio));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Private speech-to-text failed." },
      { status: 503 },
    );
  }
}
