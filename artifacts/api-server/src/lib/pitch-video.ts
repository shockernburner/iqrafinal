// Resolves an admin-entered link into an embeddable founder's pitch video.
// YouTube and Vimeo are verified through their public oEmbed endpoints; the
// server only ever calls those fixed hosts, never the URL the admin typed, so
// this can't be used to probe internal addresses. Direct video files are
// accepted by URL shape (the admin's browser checks they actually play).

export type PitchVideoProvider = "youtube" | "vimeo" | "file";

export type ParsedVideoLink =
  | { provider: "youtube"; id: string }
  | { provider: "vimeo"; id: string; hash: string | null }
  | { provider: "file"; url: string };

export type ResolvedPitchVideo = {
  url: string;
  provider: PitchVideoProvider;
  embedUrl: string;
  title: string | null;
  thumbnailUrl: string | null;
};

export class PitchVideoError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 502 = 400,
  ) {
    super(message);
  }
}

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIDEO_FILE_EXTENSION = /\.(mp4|webm|mov|m4v|ogv)$/i;
const OEMBED_TIMEOUT_MS = 8000;

/** Pure link parsing: works out the provider and video id, or throws a friendly error. */
export function parseVideoLink(input: string): ParsedVideoLink {
  const raw = input.trim();
  if (!raw) throw new PitchVideoError("Paste a video link.");

  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new PitchVideoError("That doesn't look like a valid link.");
  }
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be" || YOUTUBE_HOSTS.has(host)) {
    let id: string | null = null;
    if (host === "youtu.be") id = segments[0] ?? null;
    else if (segments[0] === "watch") id = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(segments[0] ?? "")) id = segments[1] ?? null;
    else if (url.pathname === "/watch" || url.pathname === "/") id = url.searchParams.get("v");
    if (!id || !YOUTUBE_ID.test(id)) {
      throw new PitchVideoError("Couldn't find a video in that YouTube link. Use the video's Share link.");
    }
    return { provider: "youtube", id };
  }

  if (host === "vimeo.com" || host === "www.vimeo.com" || host === "player.vimeo.com") {
    // vimeo.com/123, vimeo.com/123/abcdef (unlisted), vimeo.com/channels/x/123, player.vimeo.com/video/123?h=abcdef
    const idIndex = segments.findIndex((s) => /^\d+$/.test(s));
    if (idIndex === -1) throw new PitchVideoError("Couldn't find a video in that Vimeo link.");
    const id = segments[idIndex]!;
    const pathHash = segments[idIndex + 1];
    const hash = url.searchParams.get("h") ?? (pathHash && /^[0-9a-f]+$/i.test(pathHash) ? pathHash : null);
    return { provider: "vimeo", id, hash };
  }

  if (url.protocol === "https:" && VIDEO_FILE_EXTENSION.test(url.pathname)) {
    return { provider: "file", url: url.toString() };
  }
  if (url.protocol !== "https:" && VIDEO_FILE_EXTENSION.test(url.pathname)) {
    throw new PitchVideoError("Video file links must use https://.");
  }
  throw new PitchVideoError(
    "Unsupported link. Use a YouTube or Vimeo link, or a direct https link to an .mp4 or .webm file.",
  );
}

type OEmbed = { title?: string; thumbnail_url?: string; html?: string };

async function fetchOEmbed(endpoint: string, notAvailable: string): Promise<OEmbed> {
  let res: Response;
  try {
    res = await fetch(endpoint, { signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS), redirect: "error" });
  } catch {
    throw new PitchVideoError("Couldn't reach the video provider to check the link. Try again in a moment.", 502);
  }
  // 400/404: no such video (YouTube answers 400 for unknown ids); 401/403: private or embedding disabled.
  if ([400, 401, 403, 404].includes(res.status)) throw new PitchVideoError(notAvailable);
  if (!res.ok) throw new PitchVideoError("The video provider couldn't check this link right now. Try again shortly.", 502);
  try {
    return (await res.json()) as OEmbed;
  } catch {
    throw new PitchVideoError("The video provider returned an unexpected response.", 502);
  }
}

function httpsOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

/** Verify the link is a playable, embeddable video and build what the landing page needs. */
export async function resolvePitchVideo(input: string): Promise<ResolvedPitchVideo> {
  const parsed = parseVideoLink(input);
  const url = input.trim();

  if (parsed.provider === "youtube") {
    const watchUrl = `https://www.youtube.com/watch?v=${parsed.id}`;
    const meta = await fetchOEmbed(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`,
      "This YouTube video isn't available to embed. Make sure it's Public or Unlisted (not Private) and that embedding is allowed.",
    );
    return {
      url,
      provider: "youtube",
      // Privacy-enhanced player: no YouTube cookies until the visitor presses play.
      embedUrl: `https://www.youtube-nocookie.com/embed/${parsed.id}?rel=0`,
      title: meta.title?.slice(0, 200) ?? null,
      thumbnailUrl: `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`,
    };
  }

  if (parsed.provider === "vimeo") {
    const pageUrl = `https://vimeo.com/${parsed.id}${parsed.hash ? `/${parsed.hash}` : ""}`;
    const meta = await fetchOEmbed(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(pageUrl)}`,
      "This Vimeo video isn't available to embed. Check its privacy settings allow embedding on other sites.",
    );
    // Vimeo's own embed src carries any privacy hash needed for unlisted videos.
    const src = meta.html?.match(/src="(https:\/\/player\.vimeo\.com\/video\/[^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
    const embedUrl =
      src ?? `https://player.vimeo.com/video/${parsed.id}${parsed.hash ? `?h=${encodeURIComponent(parsed.hash)}` : ""}`;
    return {
      url,
      provider: "vimeo",
      embedUrl,
      title: meta.title?.slice(0, 200) ?? null,
      thumbnailUrl: httpsOrNull(meta.thumbnail_url),
    };
  }

  return { url, provider: "file", embedUrl: parsed.url, title: null, thumbnailUrl: null };
}
