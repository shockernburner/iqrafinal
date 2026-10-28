import { useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetDonorsQueryKey,
  getListAdminDonorsQueryKey,
  useAddAdminDonor,
  useDeleteAdminDonor,
  useListAdminDonors,
} from "@workspace/api-client-react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { countryLabel, countryOptions } from "@/lib/country";

export function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function errorMessage(err: any) {
  return err?.data?.error ?? err?.error ?? err?.message ?? "Unexpected error";
}

/**
 * Manually added donors (e.g. offline or bank-transfer donations). They appear
 * on the public donors list alongside Stripe donors, ordered by donation date.
 */
export default function AdminDonors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const countries = useMemo(() => countryOptions(), []);
  const { data, isLoading } = useListAdminDonors();
  const donors = data?.donors ?? [];

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [donatedAt, setDonatedAt] = useState(todayIso());

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getListAdminDonorsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDonorsQueryKey() });
  };

  const addDonor = useAddAdminDonor({
    mutation: {
      onSuccess: (donor) => {
        toast({ title: "Donor added", description: `${donor.name} now appears on the donors list.` });
        setName("");
        setCountry("");
        setAnonymous(false);
        setDonatedAt(todayIso());
        refresh();
      },
      onError: (err: any) => toast({ title: "Could not add donor", description: errorMessage(err), variant: "destructive" }),
    },
  });

  const deleteDonor = useDeleteAdminDonor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Donor removed" });
        refresh();
      },
      onError: (err: any) => toast({ title: "Could not remove donor", description: errorMessage(err), variant: "destructive" }),
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addDonor.mutate({ data: { name: name.trim(), country: country || null, anonymous, donatedAt: donatedAt || null } });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b pb-4 mb-4">
          <CardTitle>Add a donor</CardTitle>
          <CardDescription>
            For donations received outside the website. Online (Stripe) donors are listed automatically. The public list
            is ordered first come, first listed by donation date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="donor-name">
                Donor name <span className="text-destructive">*</span>
              </Label>
              <Input id="donor-name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aisha Rahman" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="donor-country">Country</Label>
              <select
                id="donor-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— Not specified —</option>
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="donor-date">
                Donation date <span className="text-destructive">*</span>
              </Label>
              <Input id="donor-date" type="date" required max={todayIso()} value={donatedAt} onChange={(e) => setDonatedAt(e.target.value)} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} />
                Show as "Anonymous" on the public list
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={!name.trim() || !donatedAt || addDonor.isPending}>
                {addDonor.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Add donor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4 mb-4">
          <CardTitle>Manually added donors</CardTitle>
          <CardDescription>In public-list order.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Donation date</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donors.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-muted-foreground">{countryLabel(d.country) || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={d.anonymous ? "secondary" : "outline"}>{d.anonymous ? "Anonymous" : "Public"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(`${d.donatedAt}T00:00:00`).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Remove ${d.name}`}
                          disabled={deleteDonor.isPending}
                          onClick={() => {
                            if (window.confirm(`Remove ${d.name} from the donors list?`)) deleteDonor.mutate({ id: d.id });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {donors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No manually added donors yet.
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
