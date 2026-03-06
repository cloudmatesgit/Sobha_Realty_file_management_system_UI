import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { TierBadge } from "@/components/common/TierBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { formatBytes, formatDate, getDaysSince } from "@/lib/utils";

import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Archive,
  RotateCcw,
  Trash2,
  FileText,
  Folder,
  Clock,
} from "lucide-react";
import { Tier, FileStatus } from "@/types";

export default function FileInventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingQuery, setPendingQuery] = useState("");

  const clearFilters = () => {
    setTierFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setPendingQuery("");
    setAgeFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };
  const [tierFilter, setTierFilter] = useState<Tier | "all">("all");
  const [statusFilter, setStatusFilter] = useState<FileStatus | "all">("all");
  const [ageFilter, setAgeFilter] = useState<"all" | "30" | "60" | "90" | "6m" | "1y" | "2y" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 100;

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
    
    // Add date filter to API call based on backend support
    if (ageFilter === "custom") {
      // Use date range for custom filter
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }
    } else {
      // Use max_days for predefined filters
      const maxDays = getMaxDays(ageFilter);
      if (maxDays !== null) {
        params.max_days = maxDays;
      }
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
  }, [page, searchQuery, tierFilter, ageFilter, startDate, endDate, limit]);

  // No client-side filtering needed - API handles it
  const filteredFiles = files;

  useEffect(() => {
    setPage(0);
    setPendingQuery(""); // Clear the search box when tier or age filter changes
  }, [tierFilter, ageFilter, startDate, endDate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <PageHeader
        title="File Inventory"
        description="Browse and manage files across all storage tiers"
        actions={
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4">
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
              <div className="flex gap-3 flex-wrap">
                <Select
                  value={tierFilter}
                  onValueChange={(v) => setTierFilter(v as Tier | "all")}
                >
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="HOT">HOT</SelectItem>
                    <SelectItem value="WARM">WARM</SelectItem>
                    <SelectItem value="COLD">COLD</SelectItem>
                    {/* <SelectItem value="ARCHIVE">ARCHIVE</SelectItem> */}
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as FileStatus | "all")}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Local">Local</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                    <SelectItem value="Restoring">Restoring</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={ageFilter}
                  onValueChange={(v) => setAgeFilter(v as typeof ageFilter)}
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
            {ageFilter === "custom" && (
              <div className="flex flex-wrap gap-3 items-end pt-2 border-t">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-40"
                  />
                </div>
                <span className="text-sm text-muted-foreground mb-2">to</span>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-40"
                    min={startDate}
                  />
                </div>
                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="mb-0"
                  >
                    Clear Dates
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">File Name</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead>Last Accessed</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.fileId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate max-w-[250px]">
                          {file.fileName}
                        </span>
                      </div>
                    </TableCell>
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
                      <div>
                        <span>
                          {file.osAccessedAt
                            ? formatDate(new Date(file.osAccessedAt))
                            : ""}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {file.osAccessedAt
                            ? getDaysSince(new Date(file.osAccessedAt))
                            : ""}{" "}
                          days ago
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {file.modifiedAt
                        ? formatDate(new Date(file.modifiedAt))
                        : ""}
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={file.accessClass ?? "UNKNOWN"} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={file.fileStatus || "Local"} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {file.status === "Local" && (
                            <DropdownMenuItem>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {file.status === "Archived" && (
                            <DropdownMenuItem>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination placeholder */}
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
