import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { TierBadge } from "@/components/common/TierBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBytes, formatDate } from "@/lib/utils";
import {
  Archive,
  RotateCcw,
  FileText,
  Folder,
  Clock,
  Download,
} from "lucide-react";
import { RestoreStatus } from "@/types";
import { Search, Filter } from "lucide-react";
import { Tier, FileStatus } from "@/types";

// const restoreJobs = [
//   {
//     id: "1",
//     fileName: "legacy_database_backup_2019.sql",
//     path: "/backups/database/",
//     size: 5368709120,
//     status: "Restoring" as RestoreStatus,
//     requestedAt: new Date("2024-12-31T08:00:00"),
//     progress: 65,
//     tier: "Expedited",
//     destination: "/restored/",
//   },
//   {
//     id: "2",
//     fileName: "compliance_documents_2022.pdf",
//     path: "/legal/compliance/",
//     size: 15728640,
//     status: "Requested" as RestoreStatus,
//     requestedAt: new Date("2024-12-31T10:30:00"),
//     progress: 0,
//     tier: "Standard",
//     destination: "/legal/active/",
//   },
//   {
//     id: "3",
//     fileName: "marketing_assets_2021.zip",
//     path: "/marketing/archive/",
//     size: 2147483648,
//     status: "Available" as RestoreStatus,
//     requestedAt: new Date("2024-12-30T14:00:00"),
//     progress: 100,
//     tier: "Bulk",
//     destination: "/marketing/assets/",
//   },
// ];

export default function ArchiveRestore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingQuery, setPendingQuery] = useState("");

  const [tierFilter, setTierFilter] = useState<Tier | "all">("all");
  const [statusFilter, setStatusFilter] = useState<FileStatus | "all">("all");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 100;
  const [ageFilter, setAgeFilter] = useState<"all" | "30" | "60" | "90" | "6m" | "1y" | "2y" | "custom">(
    "all"
  );
  const archiveEnabled = false; // future me true kar sakte ho
  const clearFilters = () => {
    setTierFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setPendingQuery("");
    setAgeFilter("all");
    setPage(0);
  };
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  // Convert age filter to max_days for API
  const getMaxDays = (filter: string): number | null => {
    switch (filter) {
      case "30":
        return 30;
      case "60":
        return 60;
      case "90":
        return 90;
      case "6m":
        return 180;
      case "1y":
        return 365;
      case "2y":
        return 730;
      case "all":
      case "custom":
      default:
        return null;
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, string | number> = {
      skip: page * limit,
      limit,
    };
    if (searchQuery) params.filename = searchQuery;
    if (tierFilter && tierFilter !== "all") params.tier = tierFilter;

    // Add age filter to API call
    const maxDays = getMaxDays(ageFilter);
    if (maxDays !== null) {
      params.max_days = maxDays;
    }

    const searchStr = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    fetch(`/api/access?${searchStr}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setFiles(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [page, searchQuery, tierFilter, ageFilter, limit]);

  // No client-side filtering needed - API handles it
  const filteredFiles = files;

  useEffect(() => {
    setPage(0);
    setPendingQuery(""); // Clear the search box when tier or age filter changes
  }, [tierFilter, ageFilter]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <PageHeader title="Archive" description="Manage archived files" />

      <Tabs defaultValue="archived" className="space-y-4">
        {/* <TabsList>
          <TabsTrigger value="archived">
            <Archive className="h-4 w-4 mr-2" />
            Archived Files
          </TabsTrigger>
          <TabsTrigger value="restores">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restore Jobs ({restoreJobs.length})
          </TabsTrigger>
        </TabsList> */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-1 items-center gap-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files by name or path..."
                  className="pl-9"
                  value={pendingQuery}
                  onChange={(e) => setPendingQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSearchQuery(pendingQuery);
                  }}
                  style={{ minWidth: "300px" }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery(pendingQuery)}
                >
                  Search
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                {[
                  { label: "30 Days", value: "HOT" },
                  { label: "60 Days", value: "WARM" },
                  { label: "90 Days", value: "COLD" },
                ].map((item) => (
                  <Button
                    key={item.value}
                    size="sm"
                    variant={tierFilter === item.value ? "default" : "outline"}
                    className={`rounded-full px-4 font-medium ${tierFilter === item.value
                      ? item.value === "HOT"
                        ? "bg-red-600 text-white"
                        : item.value === "WARM"
                          ? "bg-yellow-500 text-black"
                          : "bg-blue-600 text-white"
                      : "text-muted-foreground"
                      }`}
                    onClick={() =>
                      setTierFilter(
                        tierFilter === item.value ? "all" : (item.value as Tier)
                      )
                    }
                  >
                    {item.label}
                  </Button>
                ))}
                <Select
                  value={ageFilter}
                  onValueChange={(v) => {
                    setAgeFilter(v as "all" | "30" | "60" | "90" | "6m" | "1y" | "2y" | "custom");
                  }}
                >
                  <SelectTrigger className="w-40">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="60">Last 60 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="1y">Last 1 Year</SelectItem>
                    <SelectItem value="2y">Last 2 Years</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="archived">
          {/* Selection Actions */}
          {selectedFiles.length > 0 && (
            <Card className="mb-4 border-primary">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    <span className="font-medium">{selectedFiles.length}</span>{" "}
                    file(s) selected
                  </p>
                  <Dialog
                  // open={restoreDialogOpen}
                  // onOpenChange={setRestoreDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" disabled={!archiveEnabled}>
                        {/* <RotateCcw className="h-4 w-4 mr-2" /> */}
                        Move to Archive
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Restore Files</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm text-muted-foreground">
                          You're about to restore {selectedFiles.length} file(s)
                          from archive.
                        </p>
                        <div>
                          <Label>Restore Tier</Label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expedited">
                                Expedited (1-5 minutes, higher cost)
                              </SelectItem>
                              <SelectItem value="standard">
                                Standard (3-5 hours, moderate cost)
                              </SelectItem>
                              <SelectItem value="bulk">
                                Bulk (5-12 hours, lowest cost)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Restore Destination</Label>
                          <Input
                            placeholder="/restored/files/"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                          <Button
                            variant="outline"
                          // onClick={() => setRestoreDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={() => setRestoreDialogOpen(false)}>
                            Start Restore
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead>Last Accessed</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.fileId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFiles.includes(file.fileId)}
                          onCheckedChange={() =>
                            toggleFileSelection(file.fileId)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{file.fileName}</span>
                        </div>
                      </TableCell>
                      {/* <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Folder className="h-3 w-3" />
                          {file.fullPath}
                        </div>
                      </TableCell> */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Folder className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">
                            {file.fullPath}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatBytes(file.sizeBytes)}
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(file.osAccessedAt))}
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(file.modifiedAt))}
                      </TableCell>
                      <TableCell>
                        <TierBadge tier={file.accessClass ?? "UNKNOWN"} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={file.status || "Local"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="restores">
          <div className="space-y-4">
            {restoreJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <RotateCcw className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{job.fileName}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Folder className="h-3 w-3" />
                          {job.path}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-mono">{formatBytes(job.size)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Restore Tier</p>
                      <p className="font-medium">{job.tier}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Requested</p>
                      <p>{formatDate(job.requestedAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Destination</p>
                      <p className="font-mono text-xs">{job.destination}</p>
                    </div>
                  </div>

                  {job.status !== "Available" && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}

                  {job.status === "Available" && (
                    <div className="flex justify-end mt-2">
                      <Button size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent> */}
      </Tabs>
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredFiles.length} files
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={files.length < limit}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
