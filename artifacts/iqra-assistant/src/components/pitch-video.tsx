import { useState } from "react";
import type { PitchVideo } from "@workspace/api-client-react";
import { Play } from "lucide-react";

const IFRAME_HOSTS = new Set(["www.youtube-nocookie.com", "player.vimeo.com"]);

/** Defence in depth: only ever render players from the hosts the server resolves to. */
export function safeVideoSrc(video: PitchVideo): string | null {
  try {
    const url = new URL(video.embedUrl);
    if (url.protocol !== "https:") return null;
    if (video.provider === "file") return url.toString();
    return IFRAME_HOSTS.has(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

function withAutoplay(src: string) {
  const url = new URL(src);
  url.searchParams.set("autoplay", "1");
  return url.toString();
}

/**
 * 16:9 player. YouTube/Vimeo show a lightweight poster with a play button and
 * only load the third-party player when pressed, which keeps the landing page
 * fast and avoids third-party requests for visitors who don't watch.
 */
export function PitchVideoPlayer({ video, className = "" }: { video: PitchVideo; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const src = safeVideoSrc(video);
  if (!src) return null;

  const label = video.title ? `Play video: ${video.title}` : "Play video";
  const frame = `relative w-full aspect-video overflow-hidden rounded-2xl bg-black shadow-xl shadow-primary/10 ring-1 ring-border/60 ${className}`;

  if (video.provider === "file") {
    return (
      <div className={frame}>
        <video src={src} controls preload="metadata" playsInline className="absolute inset-0 h-full w-full" aria-label={video.title ?? "Founder's message"} />
      </div>
    );
  }

  return (
    <div className={frame}>
      {playing ? (
        <iframe
          src={withAutoplay(src)}
          title={video.title ?? "Founder's message"}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={label}
          data-testid="button-play-pitch"
        >
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
          ) : (
            <span className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70" />
          )}
          <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/10" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition-transform group-hover:scale-110 sm:h-20 sm:w-20">
            <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
          </span>
        </button>
      )}
    </div>
  );
}
