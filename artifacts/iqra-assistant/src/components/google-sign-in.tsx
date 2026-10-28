import { useEffect, useRef, useState } from "react";
import { useGetAuthConfig, useGoogleSignIn, getGetSessionQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GSI_SRC = "https://accounts.google.com/gsi/client";

type GoogleCredentialResponse = { credential?: string };
type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    context?: "signin" | "signup" | "use";
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let gsiScriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiScriptPromise = null;
        reject(new Error("Failed to load Google sign-in."));
      };
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

// "Continue with Google" button plus an "or" divider. Renders nothing when the
// server has no GOOGLE_CLIENT_ID configured.
export function GoogleSignIn({ mode }: { mode: "signin" | "signup" }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptFailed, setScriptFailed] = useState(false);

  // @ts-ignore - generated hook option typing requires queryKey but it is supplied internally
  const { data: config } = useGetAuthConfig({ query: { staleTime: Infinity, retry: false } });
  const clientId = config?.googleClientId ?? null;

  const googleMutation = useGoogleSignIn({
    mutation: {
      onSuccess: (user) => {
        queryClient.setQueryData(getGetSessionQueryKey(), { user });
        toast({ title: "Welcome", description: "Signed in with Google." });
        setLocation("/");
      },
      onError: (error: any) => {
        toast({
          title: "Google sign-in failed",
          description: error?.error || "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  // Keep the latest mutate in a ref so the GIS callback (registered once) never goes stale.
  const mutateRef = useRef(googleMutation.mutate);
  mutateRef.current = googleMutation.mutate;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGsiScript()
      .then(() => {
        const container = containerRef.current;
        const gsi = window.google?.accounts?.id;
        if (cancelled || !container || !gsi) return;
        gsi.initialize({
          client_id: clientId,
          ux_mode: "popup",
          context: mode === "signup" ? "signup" : "signin",
          callback: (response) => {
            if (response.credential) {
              mutateRef.current({ data: { credential: response.credential } });
            }
          },
        });
        container.innerHTML = "";
        gsi.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: mode === "signup" ? "signup_with" : "continue_with",
          logo_alignment: "center",
          width: Math.min(container.clientWidth || 400, 400),
        });
      })
      .catch(() => {
        if (!cancelled) setScriptFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, mode]);

  if (!clientId || scriptFailed) return null;

  return (
    <div className="space-y-6 mb-6">
      <div className="relative flex justify-center min-h-[44px]">
        <div ref={containerRef} className="w-full flex justify-center" />
        {googleMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 rounded-md">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          or {mode === "signup" ? "sign up" : "sign in"} with email
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
