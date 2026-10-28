import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetKbUploadStatusQueryKey,
  useSetupKbUploadPassword,
  useVerifyKbUploadPassword,
} from "@workspace/api-client-react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";

const MIN_LENGTH = 12;

/**
 * Second-password prompt shown before every knowledge-base upload or Drive
 * import. The first time, the admin creates the password (with confirmation);
 * afterwards they enter it each time. On success it hands back a single-use
 * grant token for the upload request.
 */
export function KbUploadGate({
  open,
  configured: configuredProp,
  actionLabel,
  onOpenChange,
  onUnlocked,
}: {
  open: boolean;
  configured: boolean;
  actionLabel: string;
  onOpenChange: (open: boolean) => void;
  onUnlocked: (token: string) => void;
}) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Fix the mode when the prompt opens, so a status refresh after first-time
  // setup doesn't flip the title while the dialog animates closed.
  const [configured, setConfigured] = useState(configuredProp);

  useEffect(() => {
    if (open) setConfigured(configuredProp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirm("");
      setError(null);
    }
  }, [open]);

  const handleSuccess = (grant: { token: string }) => {
    queryClient.invalidateQueries({ queryKey: getGetKbUploadStatusQueryKey() });
    onUnlocked(grant.token);
  };
  const handleError = (err: any) => {
    setError(err?.data?.error ?? err?.error ?? err?.message ?? "Something went wrong. Please try again.");
    // A 409 means our view of "configured" is stale; refresh it.
    if (err?.status === 409) {
      setConfigured(!configured);
      queryClient.invalidateQueries({ queryKey: getGetKbUploadStatusQueryKey() });
    }
  };

  const setup = useSetupKbUploadPassword({ mutation: { onSuccess: handleSuccess, onError: handleError } });
  const verify = useVerifyKbUploadPassword({ mutation: { onSuccess: handleSuccess, onError: handleError } });
  const pending = setup.isPending || verify.isPending;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (configured) {
      if (!password) return setError("Enter your upload password.");
      verify.mutate({ data: { password } });
      return;
    }
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (password !== confirm) return setError("Passwords do not match.");
    setup.mutate({ data: { password } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Don't hand focus back to the page on close: the upload dialog opens right
          after this one, and a focus move outside it would dismiss it. */}
      <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {configured ? <KeyRound className="w-5 h-5 text-primary" /> : <ShieldCheck className="w-5 h-5 text-primary" />}
              {configured ? "Enter upload password" : "Create your upload password"}
            </DialogTitle>
            <DialogDescription>
              {configured
                ? `Knowledge base changes need your second password every time. Enter it to ${actionLabel}.`
                : `Knowledge base uploads are protected by a second password, separate from your sign-in. Create it now (at least ${MIN_LENGTH} characters) — you'll enter it before every upload or Drive import.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kb-upload-password">{configured ? "Upload password" : "New upload password"}</Label>
              <PasswordInput
                id="kb-upload-password"
                autoFocus
                autoComplete={configured ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {!configured && (
              <div className="space-y-2">
                <Label htmlFor="kb-upload-password-confirm">Confirm upload password</Label>
                <PasswordInput
                  id="kb-upload-password-confirm"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {configured ? "Continue" : "Save and continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
