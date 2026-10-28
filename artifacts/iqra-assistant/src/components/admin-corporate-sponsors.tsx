import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCorporateSponsorsQueryKey,
  getListAdminCorporateSponsorsQueryKey,
  useAddAdminCorporateSponsor,
  useDeleteAdminCorporateSponsor,
  useListAdminCorporateSponsors,
} from "@workspace/api-client-react";
import { ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { errorMessage, todayIso } from "@/components/admin-donors";

const MAX_LOGO_BYTES = 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Corporate sponsors shown in the landing-page marquee, in first-come order. */
export default function AdminCorporateSponsors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useListAdminCorporateSponsors();
  const sponsors = data?.sponsors ?? [];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sponsoredSince, setSponsoredSince] = useState(todayIso());
  const [logo, setLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!logo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(logo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getListAdminCorporateSponsorsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCorporateSponsorsQueryKey() });
  };

  const addSponsor = useAddAdminCorporateSponsor({
    mutation: {
      onSuccess: (sponsor) => {
        toast({ title: "Sponsor added", description: `${sponsor.name} now appears on the landing page.` });
        setName("");
        setWebsiteUrl("");
        setSponsoredSince(todayIso());
        setLogo(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refresh();
      },
      onError: (err: any) => toast({ title: "Could not add sponsor", description: errorMessage(err), variant: "destructive" }),
    },
  });

  const deleteSponsor = useDeleteAdminCorporateSponsor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Sponsor removed" });
        refresh();
      },
      onError: (err: any) => toast({ title: "Could not remove sponsor", description: errorMessage(err), variant: "destructive" }),
    },
  });

  const onLogoChange = (file: File | null) => {
    setLogoError(null);
    if (file && !LOGO_TYPES.includes(file.type)) {
      setLogoError("Use a PNG, JPEG, or WebP image.");
      setLogo(null);
      return;
    }
    if (file && file.size > MAX_LOGO_BYTES) {
      setLogoError("The logo must be 1 MB or smaller.");
      setLogo(null);
      return;
    }
    setLogo(file);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !logo) return;
    addSponsor.mutate({
      data: {
        name: name.trim(),
        logo,
        ...(websiteUrl.trim() ? { websiteUrl: websiteUrl.trim() } : {}),
        ...(sponsoredSince ? { sponsoredSince } : {}),
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b pb-4 mb-4">
          <CardTitle>Add a corporate sponsor</CardTitle>
          <CardDescription>
            Shown on the landing page with the logo above the company name, ordered first come, first listed by
            sponsorship date. A transparent or white-background logo looks best.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sponsor-name">
                  Company name <span className="text-destructive">*</span>
                </Label>
                <Input id="sponsor-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Crescent Holdings" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor-logo">
                  Logo (PNG, JPEG, WebP · max 1 MB) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sponsor-logo"
                  ref={fileInputRef}
                  type="file"
                  required
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                />
                {logoError && <p className="text-sm text-destructive">{logoError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor-website">Website</Label>
                <Input id="sponsor-website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com (optional)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor-date">
                  Sponsoring since <span className="text-destructive">*</span>
                </Label>
                <Input id="sponsor-date" type="date" required max={todayIso()} value={sponsoredSince} onChange={(e) => setSponsoredSince(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-muted-foreground">Preview</span>
              <div className="h-20 w-40 flex items-center justify-center rounded-lg bg-white border border-border/50 shadow-sm p-3">
                {preview ? (
                  <img src={preview} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                )}
              </div>
              <span className="max-w-40 text-center text-sm font-medium line-clamp-2">{name || "Company name"}</span>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={!name.trim() || !logo || !sponsoredSince || addSponsor.isPending}>
                {addSponsor.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add sponsor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4 mb-4">
          <CardTitle>Corporate sponsors</CardTitle>
          <CardDescription>
            {sponsors.length} sponsor{sponsors.length === 1 ? "" : "s"}, in display order. The landing page scrolls them
            automatically once there are more than fit on screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Sponsoring since</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsors.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="h-10 w-20 flex items-center justify-center rounded bg-white border border-border/50 p-1">
                          <img src={s.logoUrl} alt={`${s.name} logo`} className="max-h-full max-w-full object-contain" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[220px] truncate">
                        {s.websiteUrl ? (
                          <a href={s.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {s.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(`${s.sponsoredSince}T00:00:00`).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove ${s.name}`}
                          disabled={deleteSponsor.isPending}
                          onClick={() => {
                            if (window.confirm(`Remove ${s.name} from corporate sponsors?`)) deleteSponsor.mutate({ id: s.id });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sponsors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No corporate sponsors yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
