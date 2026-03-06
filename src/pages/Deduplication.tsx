import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect } from "react";
import { formatBytes, formatNumber } from "@/lib/utils";
import {
  Copy,
  Play,
  Download,
  Trash2,
  Eye,
  FileText,
  Folder,
  HardDrive,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { fetchDashboardData } from "@/api/dashboard";

export default function Deduplication() {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 25;
  const [metrics, setMetrics] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [allGroups, setAllGroups] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/duplicates?skip=${page * limit}&limit=${limit}`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setAllGroups(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [page]);

  // Filter groups by year
  useEffect(() => {
    setPage(0); // Reset to first page when filter changes
    if (yearFilter === "all") {
      setGroups(allGroups);
    } else {
      const filtered = allGroups.filter((group) => {
        // Check if any file in the group matches the year filter
        return group.files.some((file: any) => {
          const fileDate = file.lastModified || file.createdAt || file.dateModified || file.modifiedDate;
          if (!fileDate) return false;
          
          const date = new Date(fileDate);
          if (isNaN(date.getTime())) return false; // Invalid date
          
          const fileYear = date.getFullYear();
          
          if (yearFilter === "2024") return fileYear === 2024;
          if (yearFilter === "2023") return fileYear === 2023;
          if (yearFilter === "2022") return fileYear === 2022;
          if (yearFilter === "2021") return fileYear === 2021;
          if (yearFilter === "2020") return fileYear === 2020;
          if (yearFilter === "older") return fileYear < 2020;
          
          return true;
        });
      });
      setGroups(filtered);
    }
  }, [yearFilter, allGroups]);

  const totalPotentialSavings = groups.reduce(
    (acc, group) => acc + (group.potentialSavings || 0),
    0
  );
  const totalDuplicateFiles = groups.reduce(
    (acc, group) => acc + (group.files.length - 1),
    0
  );

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const exportReport = async () => {
    setExporting(true);

    try {
      // Fetch all duplicate groups
      const allGroups: any[] = [];
      let skip = 0;
      const batchSize = 100; // Fetch in batches of 100
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`/api/duplicates?skip=${skip}&limit=${batchSize}`);
        if (!response.ok) throw new Error("Network response was not ok");

        const batch = await response.json();

        if (batch.length === 0) {
          hasMore = false;
        } else {
          allGroups.push(...batch);
          skip += batchSize;

          // If we got less than batchSize, we've reached the end
          if (batch.length < batchSize) {
            hasMore = false;
          }
        }
      }

      // Apply year filter if selected
      let groupsToExport = allGroups;
      if (yearFilter !== "all") {
        groupsToExport = allGroups.filter((group) => {
          return group.files.some((file: any) => {
            const fileDate = file.lastModified || file.createdAt || file.dateModified || file.modifiedDate;
            if (!fileDate) return false;
            
            const date = new Date(fileDate);
            if (isNaN(date.getTime())) return false;
            
            const fileYear = date.getFullYear();
            
            if (yearFilter === "2024") return fileYear === 2024;
            if (yearFilter === "2023") return fileYear === 2023;
            if (yearFilter === "2022") return fileYear === 2022;
            if (yearFilter === "2021") return fileYear === 2021;
            if (yearFilter === "2020") return fileYear === 2020;
            if (yearFilter === "older") return fileYear < 2020;
            
            return true;
          });
        });
      }

      if (groupsToExport.length === 0) {
        alert("No duplicate groups to export for the selected year filter");
        return;
      }

      // Prepare CSV data
      const csvRows: string[] = [];

      // CSV Header
      csvRows.push("Fingerprint,File Path,File Name,Size (Bytes),Size (Formatted),Is Original,Potential Savings (Bytes),Potential Savings (Formatted),Group File Count");

      // CSV Data rows - export filtered groups
      groupsToExport.forEach((group) => {
        group.files.forEach((file: any, index: number) => {
          const fileName = (file.fullPath || "").split("/").pop() || "";
          const isOriginal = index === 0 ? "Yes" : "No";
          const potentialSavings = group.potentialSavings || 0;

          csvRows.push(
            [
              `"${group.fingerprint || ""}"`,
              `"${file.fullPath || ""}"`,
              `"${fileName}"`,
              file.sizeBytes || 0,
              `"${formatBytes(file.sizeBytes || 0)}"`,
              isOriginal,
              potentialSavings,
              `"${formatBytes(potentialSavings)}"`,
              group.files.length,
            ].join(",")
          );
        });
      });

      // Create CSV content
      const csvContent = csvRows.join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      const yearSuffix = yearFilter !== "all" ? `_${yearFilter}` : "_full";
      link.setAttribute("download", `duplicate_report${yearSuffix}_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      // Show success message
      const filterText = yearFilter !== "all" ? ` (filtered by ${yearFilter})` : "";
      alert(`Successfully exported ${groupsToExport.length} duplicate groups${filterText} with ${csvRows.length - 1} total files`);
    } catch (err: any) {
      alert(`Error exporting report: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchDashboardData()
      .then((data) => {
        const mapped = {
          total_storage_tb: Number((data.totalSizeBytes / 1e12).toFixed(2)),
          files_scanned: data.totalFiles,
          estimated_savings: Math.round(data.duplicateFiles * 0.05), // example logic
          duplicate_files: data.duplicateFiles,
          duplicate_groups: data.duplicateGroups,
          totalDuplicateSize: data.TotalDuplicateSize || data.totalDuplicateSize || 0,
          restores_in_progress: 0,

          by_tier: {
            hot: data.hotFiles,
            warm: data.warmFiles,
            cold: data.coldFiles,
            archive: 0,
          },

          aging: {
            "0-30": Math.round(data.hotFiles * 0.6),
            "30-90": Math.round(data.hotFiles * 0.4),
            "90-180": Math.round(data.coldFiles * 0.6),
            "180+": Math.round(data.coldFiles * 0.4),
          },
        };

        setMetrics(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Deduplication"
        description="Identify and manage duplicate files to reclaim storage space"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportReport}
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export Report"}
            </Button>
            <Button size="sm">
              <Play className="h-4 w-4 mr-2" />
              Run Scan
            </Button>
          </div>
        }
      />
      {/* Year Filter */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Year:</span>
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2020">2020</SelectItem>
                <SelectItem value="older">Older than 2020</SelectItem>
              </SelectContent>
            </Select>
            {yearFilter !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setYearFilter("all")}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Duplicate Groups"
          value={metrics?.duplicate_groups ?? 0}
          subtitle="groups identified"
          icon={Copy}
          iconColor="text-warning"
        />
        <StatCard
          title="Duplicate Files"
          value={metrics?.duplicate_files ?? 0}
          subtitle="files can be removed"
          icon={FileText}
          iconColor="text-info"
        />
        <StatCard
          title="Duplicate Storage"
          value={
            metrics?.totalDuplicateSize
              ? formatBytes(metrics.totalDuplicateSize)
              : "-"
          }
          subtitle="space recoverable"
          icon={HardDrive}
          iconColor="text-success"
        />
      </div>
      {/* Selected Actions */}
      {selectedGroups.length > 0 && (
        <Card className="mb-4 border-primary">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <span className="font-medium">{selectedGroups.length}</span>{" "}
                group(s) selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Files
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Duplicates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Duplicate Groups */}
      <div className="space-y-4">
        {groups.map((group, idx) => {
          const groupKey = group.fingerprint; // ✅ CORRECT PLACE

          return (
            <Card key={groupKey}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedGroups.includes(groupKey)}
                      onCheckedChange={() => toggleGroup(groupKey)}
                    />

                    <div>
                      <CardTitle className="text-sm font-mono">
                        {group.fingerprint}
                      </CardTitle>

                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary">
                          {group.files.length} files
                        </Badge>

                        <span className="text-sm text-success font-medium">
                          Save{" "}
                          {group.potentialSavings
                            ? formatBytes(group.potentialSavings)
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedGroup(
                        expandedGroup === groupKey ? null : groupKey
                      )
                    }
                  >
                    {expandedGroup === groupKey ? "Hide" : "Show"} Files
                  </Button>
                </div>
              </CardHeader>

              {expandedGroup === groupKey && (
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Path</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {group.files.map((file, index) => (
                        <TableRow key={file.fullPath || index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {(file.fullPath || "").split("/").pop()}
                              </span>

                              {index === 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Original
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="font-mono text-sm">
                            {file.fullPath}
                          </TableCell>

                          <TableCell className="text-right font-mono">
                            {formatBytes(file.sizeBytes || 0)}
                          </TableCell>

                          <TableCell>
                            {index > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Pagination for duplicate groups */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {page + 1} {yearFilter !== "all" && `(${groups.length} filtered)`}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={groups.length < limit}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
