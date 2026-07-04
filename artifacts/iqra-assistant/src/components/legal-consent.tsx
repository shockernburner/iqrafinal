import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAcceptLegal, getGetSessionQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import logoPng from "@/assets/logo.png";
import { ExternalLink, Loader2, Mail } from "lucide-react";

export default function LegalConsent() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasRead, setHasRead] = useState(false);
  const [agrees, setAgrees] = useState(false);

  const acceptMutation = useAcceptLegal({
    mutation: {
      onSuccess: (user) => {
        queryClient.setQueryData(getGetSessionQueryKey(), { user });
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
        toast({ title: "Thank you", description: "Your agreement has been recorded." });
      },
      onError: () => {
        toast({
          title: "Something went wrong",
          description: "We could not record your agreement. Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const canContinue = hasRead && agrees && !acceptMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <img src={logoPng} alt="IQRA Assistant" className="w-14 h-14 rounded-md mb-3 shadow-md" />
          <h1 className="font-serif text-2xl font-bold text-foreground">Before you continue</h1>
        </div>

        <Card className="border-border/50 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Review our legal documents</CardTitle>
            <CardDescription>
              To use IQRA Assistant, please review and accept the documents below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-2">
              <Link
                href="/terms"
                className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Privacy Policy
              </Link>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={hasRead}
                  onCheckedChange={(v) => setHasRead(v === true)}
                  className="mt-0.5"
                  data-testid="checkbox-has-read"
                />
                <span className="text-sm leading-relaxed">
                  I have read the Terms of Service and the Privacy Policy.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={agrees}
                  onCheckedChange={(v) => setAgrees(v === true)}
                  className="mt-0.5"
                  data-testid="checkbox-agrees"
                />
                <span className="text-sm leading-relaxed">
                  I agree to the Terms of Service and the Privacy Policy.
                </span>
              </label>
            </div>

            <Button
              className="w-full font-medium"
              disabled={!canContinue}
              onClick={() => acceptMutation.mutate()}
              data-testid="button-accept-legal"
            >
              {acceptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agree &amp; Continue
            </Button>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <a
                href="mailto:contact@iqra.live"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <Mail className="w-4 h-4" />
                Contact
              </a>
              <button
                type="button"
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Sign out
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
