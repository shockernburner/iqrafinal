import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X, Plus } from "lucide-react";
import logoPng from "@/assets/logo.png";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "iqra-install-dismissed";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = window.navigator.userAgent;
  const isIosDevice = /iphone|ipad|ipod/iu.test(ua);
  // iPadOS 13+ reports as Mac; detect via touch support.
  const isIpadOs = /macintosh/iu.test(ua) && navigator.maxTouchPoints > 1;
  return isIosDevice || isIpadOs;
}

function isIosSafari(): boolean {
  if (!isIos()) return false;
  const ua = window.navigator.userAgent;
  // Exclude in-app browsers / other engines that can't add to home screen.
  return !/crios|fxios|edgios|opios/iu.test(ua);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const onInstalled = () => {
      setShowBanner(false);
      setShowIosHint(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari never fires beforeinstallprompt, so surface a manual hint there.
    if (isIosSafari()) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setShowBanner(false);
    setShowIosHint(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
      return;
    }
    if (isIosSafari()) {
      setShowIosHint((prev) => !prev);
    }
  }

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-xl border border-border/60 bg-card/95 backdrop-blur shadow-lg shadow-primary/10">
        <div className="flex items-center gap-3 p-3">
          <img src={logoPng} alt="" className="h-10 w-10 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Install IQRA Assistant</p>
            <p className="text-xs text-muted-foreground">
              Add it to your home screen for quick, app-like access.
            </p>
          </div>
          <Button size="sm" onClick={handleInstall} className="shrink-0 font-medium">
            {deferredPrompt ? (
              <>
                <Download className="mr-1.5 h-4 w-4" />
                Install
              </>
            ) : (
              "How to"
            )}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIosHint && (
          <div className="border-t border-border/60 px-3 py-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <span>1. Tap the</span>
              <Share className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Share</span>
              <span>button in Safari.</span>
            </p>
            <p className="mt-1.5 flex items-center gap-1.5">
              <span>2. Choose</span>
              <Plus className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Add to Home Screen</span>
              <span>.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
