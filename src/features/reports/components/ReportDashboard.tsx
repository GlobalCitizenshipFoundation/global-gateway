"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CheckCircle, XCircle, Clock, Briefcase } from "lucide-react";
import { getApplicationOverviewReportAction } from "@/features/reports/actions";
import { type ApplicationOverviewReport } from "@/features/reports/services/report-service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export function ReportDashboard() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [reportData, setReportData] = useState<ApplicationOverviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const fetchedReport = await getApplicationOverviewReportAction();
      if (fetchedReport) {
        setReportData(fetchedReport);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load report data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchReportData();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view reports.");
    }
  }, [user, isSessionLoading]);

  if (isLoading || !reportData) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-xl shadow-md p-6">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-xl shadow-md p-6"><Skeleton className="h-64 w-full" /></Card>
          <Card className="rounded-xl shadow-md p-6"><Skeleton className="h-64 w-full" /></Card>
        </div>
      </div>
    );
  }

  const userRole: string = user?.user_metadata?.role || '';
  const isAdminOrCoordinator = ['admin', 'coordinator'].includes(userRole);

  if (!isAdminOrCoordinator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <h1 className="text-display-medium mb-4">Access Denied</h1>
        <p className="text-headline-small text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const statusChartData = reportData.applicationsByStatus.map((item: { status: string; count: number }) => ({
    name: item.status,
    count: item.count,
  }));

  const campaignChartData = reportData.applicationsByCampaign.map((item: { campaignName: string; count: number }) => ({
    name: item.campaignName,
    count: item.count,
  }));

  const COLORS = ['#880E4F', '#C2185B', '#E91E63', '#F06292', '#F8BBD0', '#880E4F', '#C2185B', '#E91E63', '#F06292', '#F8BBD0']; // M3-inspired colors

  return (
    <div className="space-y-8">
      <h1 className="text-display-small font-bold text-foreground">Reports & Insights</h1>
      <p className="text-headline-small text-muted-foreground">Overview of application and campaign performance.</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-headline-small text-foreground">Total Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-display-medium font-bold text-primary">{reportData.totalApplications}</p>
            <CardDescription className="text-body-small text-muted-foreground mt-1">Across all campaigns</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <Clock className="h-8 w-8 text-yellow-600 mb-2" />
            <CardTitle className="text-headline-small text-foreground">Pending/In Review</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-display-medium font-bold text-yellow-600">{reportData.submittedApplications + reportData.inReviewApplications}</p>
            <CardDescription className="text-body-small text-muted-foreground mt-1">Awaiting action</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle className="text-headline-small text-foreground">Accepted Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-display-medium font-bold text-green-600">{reportData.acceptedApplications}</p>
            <CardDescription className="text-body-small text-muted-foreground mt-1">Successful candidates</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <XCircle className="h-8 w-8 text-red-600 mb-2" />
            <CardTitle className="text-headline-small text-foreground">Rejected Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-display-medium font-bold text-red-600">{reportData.rejectedApplications}</p>
            <CardDescription className="text-body-small text-muted-foreground mt-1">Unsuccessful candidates</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-xl shadow-md p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-headline-large text-foreground">Applications by Status</CardTitle>
            <CardDescription className="text-body-medium text-muted-foreground">
              Distribution of applications across different statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 p-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-body-small fill-foreground" />
                <YAxis className="text-body-small fill-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '0.875rem', // body-medium
                  }}
                  labelStyle={{
                    fontWeight: 'bold',
                    color: 'hsl(var(--foreground))',
                  }}
                  itemStyle={{
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-headline-large text-foreground">Applications by Campaign</CardTitle>
            <CardDescription className="text-body-medium text-muted-foreground">
              Breakdown of applications per campaign.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 p-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={campaignChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                >
                  {campaignChartData.map((entry: { name: string; count: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '0.875rem', // body-medium
                  }}
                  labelStyle={{
                    fontWeight: 'bold',
                    color: 'hsl(var(--foreground))',
                  }}
                  itemStyle={{
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))' }} // body-medium
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}