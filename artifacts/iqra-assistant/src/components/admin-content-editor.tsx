import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { useGetSiteContent, usePutSiteContent } from "@workspace/api-client-react";
import type { SiteContent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { mergeContent } from "@/lib/site-content";

export default function AdminContentEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetSiteContent();
  const [content, setContent] = useState<Required<SiteContent>>(mergeContent(data));

  useEffect(() => {
    setContent(mergeContent(data));
  }, [data]);

  const putContent = usePutSiteContent({
    mutation: {
      onSuccess: () => {
        toast({ title: "Landing content saved" });
        queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      },
      onError: (err: any) =>
        toast({ title: "Save failed", description: err?.error, variant: "destructive" }),
    },
  });

  const handleSave = () => {
    putContent.mutate({ data: content });
  };

  if (isLoading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle>Landing Hero</CardTitle>
          <CardDescription>The headline and intro shown at the top of the landing page.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={content.hero.title}
              onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, title: e.target.value } }))}
              data-testid="input-hero-title"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Textarea
              rows={3}
              value={content.hero.subtitle}
              onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, subtitle: e.target.value } }))}
              data-testid="input-hero-subtitle"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle>Three Pillars</CardTitle>
          <CardDescription>The three feature cards below the hero.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {content.pillars.map((pillar, index) => (
            <div key={index} className="space-y-3 border-l-2 border-primary/20 pl-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Pillar {index + 1}
              </p>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={pillar.title}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      pillars: c.pillars.map((p, i) =>
                        i === index ? { ...p, title: e.target.value } : p,
                      ),
                    }))
                  }
                  data-testid={`input-pillar-title-${index}`}
                />
              </div>
              <div className="space-y-2">
                <Label>Body</Label>
                <Textarea
                  rows={2}
                  value={pillar.body}
                  onChange={(e) =>
                    setContent((c) => ({
                      ...c,
                      pillars: c.pillars.map((p, i) =>
                        i === index ? { ...p, body: e.target.value } : p,
                      ),
                    }))
                  }
                  data-testid={`input-pillar-body-${index}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle>Donation Popup</CardTitle>
          <CardDescription>The support prompt shown to landing-page visitors.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={content.popup.title}
              onChange={(e) => setContent((c) => ({ ...c, popup: { ...c.popup, title: e.target.value } }))}
              data-testid="input-popup-title"
            />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              rows={4}
              value={content.popup.body}
              onChange={(e) => setContent((c) => ({ ...c, popup: { ...c.popup, body: e.target.value } }))}
              data-testid="input-popup-body"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Support button label</Label>
              <Input
                value={content.popup.supportLabel}
                onChange={(e) =>
                  setContent((c) => ({ ...c, popup: { ...c.popup, supportLabel: e.target.value } }))
                }
                data-testid="input-popup-support-label"
              />
            </div>
            <div className="space-y-2">
              <Label>Dismiss button label</Label>
              <Input
                value={content.popup.laterLabel}
                onChange={(e) =>
                  setContent((c) => ({ ...c, popup: { ...c.popup, laterLabel: e.target.value } }))
                }
                data-testid="input-popup-later-label"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={putContent.isPending} data-testid="button-save-content">
          {putContent.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save changes
        </Button>
      </div>
    </div>
  );
}
