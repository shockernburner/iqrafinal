import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { AdminDocument } from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight, MoreHorizontal, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 50;

export type DocumentAction = "activate" | "deactivate" | "delete";

/**
 * The knowledge base holds tens of thousands of documents, so only one page is
 * rendered at a time. Memoised so the dashboard's periodic stats refresh and
 * dialog state changes don't re-render the table.
 */
export const AdminDocumentsTable = memo(function AdminDocumentsTable({
  documents,
  onAction,
}: {
  documents: AdminDocument[];
  onAction: (id: string, action: DocumentAction) => void;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return q ? documents.filter((doc) => doc.title.toLowerCase().includes(q)) : documents;
  }, [documents, deferredQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => setPage(0), [deferredQuery]);
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const start = page * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${documents.length.toLocaleString()} documents…`}
            className="pl-9"
            aria-label="Search documents by title"
          />
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {filtered.length === 0
            ? "No matches"
            : `${(start + 1).toLocaleString()}–${Math.min(start + PAGE_SIZE, filtered.length).toLocaleString()} of ${filtered.length.toLocaleString()}`}
        </p>
      </div>

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
          {rows.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{doc.title}</TableCell>
              <TableCell>
                <Badge variant={doc.status === "active" ? "default" : "secondary"}>{doc.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${doc.title}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {doc.status !== "active" && (
                      <DropdownMenuItem onClick={() => onAction(doc.id, "activate")}>Activate</DropdownMenuItem>
                    )}
                    {doc.status === "active" && (
                      <DropdownMenuItem onClick={() => onAction(doc.id, "deactivate")}>Deactivate</DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                      onClick={() => onAction(doc.id, "delete")}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                {documents.length === 0 ? "No documents found." : "No documents match your search."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {(page + 1).toLocaleString()} of {pageCount.toLocaleString()}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount - 1}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
});
