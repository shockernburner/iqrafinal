import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout";
import { 
  useGetAdminOverview, 
  useListAdminDocuments, 
  useListAdminTraining, 
  useListAdminUsers,
  useGetAdminMaintenance,
  useListAdminDonations,
  useGetAdminGrowth,
  useUploadAdminDocumentsBatch,
  useStartAdminDriveImport,
  useGetAdminDriveImport,
  useCancelAdminDriveImport,
  useUpdateAdminDocument,
  useStartAdminMaintenance,
  useAddAdminTraining,
  useUploadAdminTrainingDataset
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileText, Activity, BookOpen, Users, DollarSign, Loader2, Plus, RefreshCw, Upload, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AdminContentEditor from "@/components/admin-content-editor";
import { countryLabel } from "@/lib/country";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function fmtTick(value: string): string {
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtLabel(value: string): string {
  const d = new Date(value + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("documents");
  
  const { data: overview, isLoading: isLoadingOverview } = useGetAdminOverview();
  const { data: documentsData, isLoading: isLoadingDocs } = useListAdminDocuments();
  const { data: trainingData, isLoading: isLoadingTraining } = useListAdminTraining();
  const { data: maintenanceData, isLoading: isLoadingMaint } = useGetAdminMaintenance();
  const { data: usersData, isLoading: isLoadingUsers } = useListAdminUsers();
  const { data: donationsData, isLoading: isLoadingDonations } = useListAdminDonations();
  const { data: growthData, isLoading: isLoadingGrowth } = useGetAdminGrowth();

  const uploadDocs = useUploadAdminDocumentsBatch({
    mutation: {
      onSuccess: (result) => {
        const failed = result.results.filter((r) => !r.ok);
        if (failed.length === 0) {
          toast({
            title: `${result.uploadedCount} document${result.uploadedCount === 1 ? "" : "s"} uploaded`,
            description: "Indexing runs automatically; originals are removed from storage once indexed.",
          });
        } else {
          toast({
            title: `${result.uploadedCount} uploaded, ${result.failedCount} failed`,
            description: failed.map((r) => `${r.fileName}: ${r.error ?? "failed"}`).join(" • "),
            variant: result.uploadedCount === 0 ? "destructive" : undefined,
          });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
        setIsUploadOpen(false);
        setFiles([]);
      },
      onError: (err: any) =>
        toast({
          title: "Upload failed",
          description: err?.data?.error ?? err?.error ?? err?.message ?? "Unexpected error",
          variant: "destructive",
        }),
    }
  });

  const updateDoc = useUpdateAdminDocument({
    mutation: {
      onSuccess: () => {
        toast({ title: "Document status updated" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      }
    }
  });

  const startMaintenance = useStartAdminMaintenance({
    mutation: {
      onSuccess: () => {
        toast({ title: "Maintenance job started" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/maintenance"] });
      }
    }
  });

  const addTraining = useAddAdminTraining({
    mutation: {
      onSuccess: () => {
        toast({ title: "Training record added" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/training"] });
      }
    }
  });

  const uploadDataset = useUploadAdminTrainingDataset({
    mutation: {
      onSuccess: (result) => {
        toast({
          title: "Training dataset uploaded",
          description: `Added ${result.added} record${result.added === 1 ? "" : "s"} for all users${result.skipped > 0 ? `; skipped ${result.skipped} incomplete row${result.skipped === 1 ? "" : "s"}` : ""}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/training"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
      },
      onError: (err: any) => toast({ title: "Upload failed", description: err?.error, variant: "destructive" })
    }
  });

  // Drive import state
  const [driveUrl, setDriveUrl] = useState("");
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const { data: driveStatus } = useGetAdminDriveImport({
    query: {
      refetchInterval: (query: any) => {
        const s = query?.state?.data?.job?.status;
        return s === "scanning" || s === "running" ? 2500 : false;
      },
    },
  } as any);
  const driveJob = driveStatus?.job ?? null;
  const driveActive = driveJob?.status === "scanning" || driveJob?.status === "running";
  const startDrive = useStartAdminDriveImport({
    mutation: {
      onSuccess: () => {
        toast({ title: "Drive import started", description: "Files are downloaded and indexed one by one." });
        setIsDriveOpen(false);
        setDriveUrl("");
        queryClient.invalidateQueries({ queryKey: ["/api/admin/documents/import-drive"] });
      },
      onError: (err: any) =>
        toast({
          title: "Could not start import",
          description: err?.data?.error ?? err?.message ?? "Unexpected error",
          variant: "destructive",
        }),
    },
  });
  const cancelDrive = useCancelAdminDriveImport({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cancelling import", description: "The current file will finish, then the import stops." });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/documents/import-drive"] });
      },
    },
  });

  // Upload state
  const [files, setFiles] = useState<File[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const MAX_BATCH_BYTES = 50 * 1024 * 1024;
  const totalUploadBytes = files.reduce((sum, f) => sum + f.size, 0);
  const overBatchLimit = totalUploadBytes > MAX_BATCH_BYTES;

  // Training state
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [isDatasetOpen, setIsDatasetOpen] = useState(false);

  const handleUpload = () => {
    if (!files.length || overBatchLimit) return;
    // Dialog stays open until the upload succeeds so a failure doesn't lose the selection.
    uploadDocs.mutate({ data: { files } });
  };

  const handleAddTraining = () => {
    if (!newQuestion || !newAnswer) return;
    addTraining.mutate({ data: { question: newQuestion, answer: newAnswer } });
    setIsTrainingOpen(false);
    setNewQuestion("");
    setNewAnswer("");
  };

  const handleUploadDataset = () => {
    if (!datasetFile) return;
    uploadDataset.mutate({ data: { file: datasetFile } });
    setIsDatasetOpen(false);
    setDatasetFile(null);
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-muted/20">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">System overview, knowledge base, and maintenance.</p>
          </div>

          {/* Stats Row */}
          {isLoadingOverview ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Card key={i} className="h-32 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></Card>)}
            </div>
          ) : overview ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.usersTotal}</div>
                  <p className="text-xs text-muted-foreground mt-1">{overview.adminsTotal} admins</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Knowledge Docs</CardTitle>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.documentsTotal}</div>
                  <p className="text-xs text-muted-foreground mt-1">{overview.activeDocuments} active</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Training Rows</CardTitle>
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.trainingRowsTotal}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Donations</CardTitle>
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(overview.donationsTotal / 100).toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">{overview.donationsCount} total contributions</p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-7 max-w-4xl h-auto">
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="documents">Knowledge Base</TabsTrigger>
              <TabsTrigger value="training">Training</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="donations">Sponsors</TabsTrigger>
              <TabsTrigger value="content">Landing Content</TabsTrigger>
            </TabsList>

            <TabsContent value="growth" className="mt-6">
              {isLoadingGrowth ? (
                <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2"><CardDescription>Registered members</CardDescription></CardHeader>
                      <CardContent><p className="text-3xl font-bold tabular-nums">{growthData?.totals.users ?? 0}</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardDescription>Landing visits</CardDescription></CardHeader>
                      <CardContent><p className="text-3xl font-bold tabular-nums">{growthData?.totals.pageVisits ?? 0}</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardDescription>Donations</CardDescription></CardHeader>
                      <CardContent><p className="text-3xl font-bold tabular-nums">{growthData?.totals.donationsCount ?? 0}</p></CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2"><CardDescription>Total raised</CardDescription></CardHeader>
                      <CardContent><p className="text-3xl font-bold tabular-nums">${((growthData?.totals.donationsAmountCents ?? 0) / 100).toLocaleString()}</p></CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="border-b pb-4 mb-2">
                        <CardTitle>New members</CardTitle>
                        <CardDescription>Sign-ups per day (last 90 days)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={growthData?.signups ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <defs>
                              <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#103D2B" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#103D2B" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e2d8" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={fmtTick} minTickGap={28} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                            <Tooltip labelFormatter={fmtLabel} />
                            <Area type="monotone" dataKey="count" name="Sign-ups" stroke="#103D2B" strokeWidth={2} fill="url(#signupFill)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="border-b pb-4 mb-2">
                        <CardTitle>Visits</CardTitle>
                        <CardDescription>Landing-page visits per day (recorded going forward)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                          <AreaChart data={growthData?.visits ?? []} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <defs>
                              <linearGradient id="visitFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#B08D2E" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#B08D2E" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e2d8" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={fmtTick} minTickGap={28} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                            <Tooltip labelFormatter={fmtLabel} />
                            <Area type="monotone" dataKey="count" name="Visits" stroke="#B08D2E" strokeWidth={2} fill="url(#visitFill)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                      <CardHeader className="border-b pb-4 mb-2">
                        <CardTitle>Donations</CardTitle>
                        <CardDescription>Amount raised per day, USD (last 90 days)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={(growthData?.donations ?? []).map((d) => ({ date: d.date, amount: d.amountCents / 100 }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e2d8" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={fmtTick} minTickGap={28} />
                            <YAxis tick={{ fontSize: 11 }} width={40} tickFormatter={(v) => `$${v}`} />
                            <Tooltip labelFormatter={fmtLabel} formatter={(v: number) => [`$${v.toLocaleString()}`, "Raised"]} />
                            <Bar dataKey="amount" name="Raised" fill="#103D2B" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    These figures come from IQRA's own database. They differ from Replit's built-in traffic analytics,
                    which counts every request to the server (including API calls and bots). Visit history is recorded
                    from the day this panel went live onward.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                  <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Source texts that ground the AI's responses.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                  <Dialog open={isDriveOpen} onOpenChange={setIsDriveOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" disabled={driveActive}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Import from Drive
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Import from Google Drive</DialogTitle>
                        <DialogDescription>
                          Paste a Google Drive folder link shared as "Anyone with the link can view". Files (including
                          those in subfolders) are downloaded, indexed, and cleaned up one by one. Duplicates are skipped
                          automatically.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          placeholder="https://drive.google.com/drive/folders/..."
                          value={driveUrl}
                          onChange={(e) => setDriveUrl(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDriveOpen(false)}>Cancel</Button>
                        <Button
                          onClick={() => startDrive.mutate({ data: { url: driveUrl } })}
                          disabled={!driveUrl.trim() || startDrive.isPending}
                        >
                          {startDrive.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Start Import
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Upload className="w-4 h-4 mr-2" /> Upload Document</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Knowledge Documents</DialogTitle>
                        <DialogDescription>
                          Select one or more PDF, txt, or word files to be indexed by the assistant. Total batch size up to 50 MB.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-2">
                        <Input
                          type="file"
                          multiple
                          accept=".pdf,.docx,.txt,.html"
                          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                        />
                        {files.length > 0 && (
                          <p className={`text-sm ${overBatchLimit ? "text-destructive" : "text-muted-foreground"}`}>
                            {files.length} file{files.length === 1 ? "" : "s"} selected — {(totalUploadBytes / 1024 / 1024).toFixed(1)} MB of 50 MB
                            {overBatchLimit ? " (over the limit — remove some files)" : ""}
                          </p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!files.length || overBatchLimit || uploadDocs.isPending}>
                          {uploadDocs.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Upload{files.length > 1 ? ` ${files.length} files` : ""}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {driveJob && (
                    <div className="mb-6 rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {driveActive ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          <span className="font-medium">
                            Drive import{" "}
                            <Badge variant={driveJob.status === "failed" ? "destructive" : "secondary"}>
                              {driveJob.status}
                            </Badge>
                          </span>
                        </div>
                        {driveActive && (
                          <Button size="sm" variant="outline" onClick={() => cancelDrive.mutate()} disabled={cancelDrive.isPending}>
                            Cancel Import
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {driveJob.status === "scanning"
                          ? "Scanning folder tree…"
                          : `${driveJob.processed} of ${driveJob.totalFiles} files — ${driveJob.imported} imported, ${driveJob.duplicates} duplicates, ${driveJob.skipped} skipped, ${driveJob.failed} failed`}
                        {driveJob.currentFile ? ` • current: ${driveJob.currentFile}` : ""}
                      </p>
                      {driveJob.error && <p className="text-sm text-destructive">{driveJob.error}</p>}
                    </div>
                  )}
                  {isLoadingDocs ? (
                    <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documentsData?.documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.title}</TableCell>
                            <TableCell>
                              <Badge variant={doc.status === 'active' ? 'default' : 'secondary'}>
                                {doc.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {doc.status !== 'active' && (
                                    <DropdownMenuItem onClick={() => updateDoc.mutate({ id: doc.id, data: { action: 'activate' } })}>
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                  {doc.status === 'active' && (
                                    <DropdownMenuItem onClick={() => updateDoc.mutate({ id: doc.id, data: { action: 'deactivate' } })}>
                                      Deactivate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                                    onClick={() => updateDoc.mutate({ id: doc.id, data: { action: 'delete' } })}
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                        {documentsData?.documents.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No documents found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                  <div>
                    <CardTitle>Training Sets</CardTitle>
                    <CardDescription>Questions and expected answers used to tune behavior.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                  <Dialog open={isDatasetOpen} onOpenChange={setIsDatasetOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Upload className="w-4 h-4 mr-2" /> Upload Dataset</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Training Dataset</DialogTitle>
                        <DialogDescription>
                          Upload an Excel (.xlsx) or CSV file with a "question" column and an "answer" column. Rows are added to the shared training set used for every user.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-2">
                        <Label>Dataset file (.xlsx or .csv)</Label>
                        <Input
                          type="file"
                          accept=".xlsx,.csv"
                          onChange={(e) => setDatasetFile(e.target.files?.[0] ?? null)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDatasetOpen(false)}>Cancel</Button>
                        <Button onClick={handleUploadDataset} disabled={!datasetFile || uploadDataset.isPending}>
                          {uploadDataset.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Upload
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isTrainingOpen} onOpenChange={setIsTrainingOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Record</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Training Record</DialogTitle>
                        <DialogDescription>Add a new scenario and the expected perspective.</DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Question / Prompt</Label>
                          <Textarea 
                            placeholder="How should I respond to unfair criticism?" 
                            value={newQuestion} 
                            onChange={(e) => setNewQuestion(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Expected Answer / Topic Focus</Label>
                          <Textarea 
                            placeholder="Patience (sabr), examples from Prophetic tradition..." 
                            value={newAnswer} 
                            onChange={(e) => setNewAnswer(e.target.value)} 
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTrainingOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddTraining} disabled={!newQuestion || !newAnswer || addTraining.isPending}>
                          {addTraining.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Add Record
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingTraining ? (
                    <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead>Question</TableHead>
                          <TableHead>Expected Source/Topic</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trainingData?.records.slice(0, 20).map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="text-muted-foreground">{record.id}</TableCell>
                            <TableCell className="font-medium truncate max-w-md">{record.question}</TableCell>
                            <TableCell className="truncate max-w-md text-muted-foreground">{record.answer}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donations" className="mt-6">
              <Card>
                <CardHeader className="border-b pb-4 mb-4">
                  <CardTitle>Sponsors & Donations</CardTitle>
                  <CardDescription>Every contribution and the supporter behind it.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDonations ? (
                    <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sponsor</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {donationsData?.donations.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-medium">{d.name || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{d.email || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{countryLabel(d.country) || "—"}</TableCell>
                              <TableCell className="text-right tabular-nums font-medium">
                                {(d.amountCents / 100).toLocaleString(undefined, { style: "currency", currency: (d.currency || "usd").toUpperCase() })}
                              </TableCell>
                              <TableCell>
                                <Badge variant={d.anonymous ? "secondary" : "outline"}>
                                  {d.anonymous ? "Anonymous" : "Public"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                          {donationsData?.donations.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No donations yet.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                  <CardDescription>View system status and trigger re-indexing jobs.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-muted border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">System Status</p>
                          <p className="text-sm text-muted-foreground">All services operational</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500 hover:bg-green-600">Healthy</Badge>
                    </div>
                    
                    {maintenanceData?.activeJob && (
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Active Job Running
                        </h4>
                        <p className="text-sm text-muted-foreground font-mono">{maintenanceData.activeJob.action}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-4">Manual Operations</h4>
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          onClick={() => startMaintenance.mutate({ data: { action: 'refresh-knowledge-index' } })}
                          disabled={startMaintenance.isPending || !!maintenanceData?.activeJob}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" /> Reindex Knowledge Base
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => startMaintenance.mutate({ data: { action: 'refresh-training-dataset' } })}
                          disabled={startMaintenance.isPending || !!maintenanceData?.activeJob}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" /> Retrain Dataset
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader className="border-b pb-4 mb-4">
                  <CardTitle>Registered Users</CardTitle>
                  <CardDescription>All accounts, their roles, and activity.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Chats</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersData?.users.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium">{u.name || "—"}</TableCell>
                              <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                              <TableCell>
                                <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={u.isActive ? "outline" : "destructive"}>
                                  {u.isActive ? "active" : "disabled"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{u.chatCount}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                          {usersData?.users.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No users found.</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="mt-6">
              <AdminContentEditor />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </AppLayout>
  );
}
