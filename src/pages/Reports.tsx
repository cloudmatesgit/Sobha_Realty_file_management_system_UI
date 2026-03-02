import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileBarChart,
  Download,
  Snowflake,
  DollarSign,
  FileText,
  Copy,
  Calendar,
  Play,
} from "lucide-react";

const reports = [
  {
    id: "1",
    name: "Cold Data by Folder",
    description:
      "Analyze cold and archive tier data distribution across directories",
    icon: Snowflake,
    lastRun: "2024-12-30",
    frequency: "Weekly",
  },
  {
    id: "2",
    name: "Savings by Tier",
    description: "Cost savings breakdown from tiering and archival operations",
    icon: DollarSign,
    lastRun: "2024-12-31",
    frequency: "Monthly",
  },
  {
    id: "3",
    name: "Largest Files",
    description: "Top 100 largest files across all storage tiers",
    icon: FileText,
    lastRun: "2024-12-29",
    frequency: "Daily",
  },
  {
    id: "4",
    name: "Duplicate Data Summary",
    description: "Overview of duplicate files and potential space reclamation",
    icon: Copy,
    lastRun: "2024-12-28",
    frequency: "Weekly",
  },
];

const recentExports = [
  { name: "savings_report_dec_2024.csv", date: "2024-12-31", size: "2.4 MB" },
  { name: "cold_data_analysis.json", date: "2024-12-30", size: "856 KB" },
  { name: "duplicate_summary.csv", date: "2024-12-28", size: "1.2 MB" },
];

export default function Reports() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and export storage analytics and insights (Preview Mode)"
      />

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{report.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {report.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Last run: {report.lastRun}
                    </div>
                    <Badge variant="secondary">{report.frequency}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Run
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Report Builder */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">Custom Report Builder</CardTitle>
          <CardDescription>
            Create a custom report with specific parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Report Type
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="storage">Storage Analysis</SelectItem>
                  <SelectItem value="activity">Activity Log</SelectItem>
                  <SelectItem value="cost">Cost Analysis</SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Date Range
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="6m">Last 6 months</SelectItem>
                  <SelectItem value="1y">Last 1 year</SelectItem>
                  <SelectItem value="2y">Last 2 years</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Format</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <FileBarChart className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentExports.map((export_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileBarChart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{export_.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {export_.date} • {export_.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
