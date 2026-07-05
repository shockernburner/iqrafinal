import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSiteContent } from "@/lib/site-content";

const DISMISS_KEY = "iqra-donation-popup-dismissed";
const SESSION_KEY = "iqra-donation-popup-shown";

// Landing-page donation prompt. Shows once per browser session unless the
// visitor ticked "don't show again" (persisted per-device in localStorage).
export default function DonationPopup() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const popup = useSiteContent().popup;

  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isLoading]);

  function persistDismissPreference() {
    if (dontShow && typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
  }

  function handleSupport() {
    persistDismissPreference();
    setOpen(false);
    // Logged-out visitors can't donate directly — send them to register first.
    setLocation(user ? "/donate" : "/register");
  }

  function handleLater() {
    persistDismissPreference();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleLater())}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-donation-popup">
        <DialogHeader>
          <div className="mx-auto inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-2">
            <Heart className="w-6 h-6 fill-primary" />
          </div>
          <DialogTitle className="font-serif text-xl text-center">{popup.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed text-center">{popup.body}</p>
        <label className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox
            checked={dontShow}
            onCheckedChange={(v) => setDontShow(v === true)}
            data-testid="checkbox-dont-show-again"
          />
          Don't show this again
        </label>
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button className="w-full" onClick={handleSupport} data-testid="button-popup-support">
            {popup.supportLabel}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleLater}
            data-testid="button-popup-later"
          >
            {popup.laterLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
