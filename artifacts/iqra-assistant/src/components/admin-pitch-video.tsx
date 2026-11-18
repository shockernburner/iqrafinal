import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSiteContentQueryKey, setPitchVideo, useDeletePitchVideo } from "@workspace/api-client-react";
import { CheckCircle2, Loader2, Trash2, Video, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePitchVideo } from "@/lib/site-content";
import { PitchVideoPlayer } from "@/components/pitch-video";

const CHECK_DELAY_MS = 900;
const FILE_CHECK_TIMEOUT_MS = 15_000;
const VIDEO_FILE = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "live" }
  | { kind: "error"; message: string };

/** Loads just the metadata of a direct video file in the browser to confirm it plays. */
function checkVideoFilePlays(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const done = (ok: boolean) => {
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(ok);
    };
    const timer = setTimeout(() => done(false), FILE_CHECK_TIMEOUT_MS);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => done(true);
    video.onerror = () => done(false);
    video.src = url;
  });
}

/**
 * Paste or type a link: once typing pauses, the link is checked and, if the
 * video is available, published to the landing page straight away.
 */
export default function AdminPitchVideo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const saved = usePitchVideo();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const touched = useRef(false);
  const latestCheck = useRef(0);

  // Show the published link until the admin starts editing.
  useEffect(() => {
    if (!touched.current) setUrl(saved?.url ?? "");
    if (saved && !touched.current) setStatus({ kind: "live" });
  }, [saved]);

  useEffect(() => {
    if (!touched.current) return;
    const link = url.trim();
    if (!link) {
      setStatus({ kind: "idle" });
      return;
    }
    if (saved && link === saved.url) {
      setStatus({ kind: "live" });
      return;
    }

    const checkId = ++latestCheck.current;
    setStatus({ kind: "checking" });
    const timer = setTimeout(async () => {
      try {
        if (VIDEO_FILE.test(link) && link.startsWith("https://") && !(await checkVideoFilePlays(link))) {
          if (checkId === latestCheck.current) {
            setStatus({ kind: "error", message: "This video file couldn't be loaded. Check the link opens the video directly and is publicly accessible." });
          }
          return;
        }
        const video = await setPitchVideo({ url: link });
        if (checkId !== latestCheck.current) return;
        await queryClient.invalidateQueries({ queryKey: getGetSiteContentQueryKey() });
        setStatus({ kind: "live" });
        toast({ title: "Founder's video is live", description: video.title ?? "Now showing on the landing page." });
      } catch (err: any) {
        if (checkId !== latestCheck.current) return;
        setStatus({ kind: "error", message: err?.data?.error ?? err?.message ?? "Couldn't check this link." });
      }
    }, CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [url, saved, queryClient, toast]);

  const remove = useDeletePitchVideo({
    mutation: {
      onSuccess: async () => {
        touched.current = true;
        latestCheck.current++;
        setUrl("");
        setStatus({ kind: "idle" });
        await queryClient.invalidateQueries({ queryKey: getGetSiteContentQueryKey() });
        toast({ title: "Video removed", description: "The landing page no longer shows a founder's video." });
      },
      onError: (err: any) =>
        toast({ title: "Couldn't remove the video", description: err?.data?.error ?? err?.message, variant: "destructive" }),
    },
  });

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" /> Founder's pitch video
        </CardTitle>
        <CardDescription>
          Paste a YouTube or Vimeo link (Public or Unlisted), or a direct https link to an .mp4/.webm file. It's checked
          automatically and, if it plays, appears on the landing page right below the headline. Leave empty to hide it.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pitch-video-url">Video link</Label>
          <div className="flex gap-2">
            <Input
              id="pitch-video-url"
              value={url}
              onChange={(e) => {
                touched.current = true;
                setUrl(e.target.value);
              }}
              placeholder="https://youtu.be/…"
              inputMode="url"
              autoComplete="off"
              data-testid="input-pitch-video-url"
            />
            {saved && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (window.confirm("Remove the founder's video from the landing page?")) remove.mutate();
                }}
                disabled={remove.isPending}
                data-testid="button-remove-pitch-video"
              >
                {remove.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Remove</span>
              </Button>
            )}
          </div>
          <p className="min-h-5 text-sm" role="status" aria-live="polite" data-testid="text-pitch-video-status">
            {status.kind === "checking" && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking the video…
              </span>
            )}
            {status.kind === "live" && saved && (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="w-4 h-4" /> Live on the landing page{saved.title ? ` — ${saved.title}` : ""}
              </span>
            )}
            {status.kind === "error" && (
              <span className="inline-flex items-start gap-1.5 text-destructive">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> {status.message}
                {saved ? " The current video stays live." : ""}
              </span>
            )}
            {status.kind === "idle" && !saved && (
              <span className="text-muted-foreground">No video set — the landing page doesn't show a video section.</span>
            )}
            {status.kind === "idle" && saved && (
              <span className="text-muted-foreground">The current video is still live. Paste a new link to replace it, or press Remove.</span>
            )}
          </p>
        </div>
        {saved && (
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Preview</p>
            <PitchVideoPlayer video={saved} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
