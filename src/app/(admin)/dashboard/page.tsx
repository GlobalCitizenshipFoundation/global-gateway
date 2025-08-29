import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Briefcase, FileText, Settings, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login"); // Redirect to login if no user session
  }

  const userRole: string = user.user_metadata?.role;

  if (userRole !== 'admin') {
    redirect("/error-pages/403"); // Redirect to 403 if authenticated but not an admin
  }

  // Placeholder data for demonstration - in a real app, this would come from a service layer
  const totalUsers = 1250;
  const activeCampaigns = 15;
  const pendingApplications = 230;
  const systemStatus = "Operational";

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <h1 className="text-display-small font-bold text-foreground">Admin Dashboard</h1>
      <p className="text-headline-small text-muted-foreground">Welcome, {user.user_metadata?.first_name || user.email}!</p>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-headline-small text-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-display-medium font-bold text-primary">{totalUsers}</p>
            <CardDescription className="text-body-small text-muted-foreground mt-1">Registered on platform</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <Briefcase className="h-8 w-8 text-secondary mb-2" />
            <CardTitle className="text-headline-small text-foreground">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-display-medium font-bold text-secondary">{activeCampaigns}</p>
            <CardDescription className="text-body-small text-muted-foreground mt-1">Currently running</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <FileText className="h-8 w-8 text-tertiary mb-2" />
            <CardTitle className="text-headline-small text-foreground">Pending Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-display-medium font-bold text-tertiary">{pendingApplications}</p>
            <CardDescription className="text-body-small text-muted-foreground mt-1">Awaiting review</CardDescription>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <Activity className="h-8 w-8 text-accent mb-2" />
            <CardTitle className="text-headline-small text-foreground">System Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-display-medium font-bold text-accent">{systemStatus}</p>
            <CardDescription className="text-body-small text-muted-foreground mt-1">All services online</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div className="space-y-4">
        <h2 className="text-headline-large font-bold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button asChild variant="tonal" className="rounded-lg px-6 py-4 h-auto text-label-large flex items-center justify-between">
            <Link href="/admin/users">
              <span>Manage Users</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="tonal" className="rounded-lg px-6 py-4 h-auto text-label-large flex items-center justify-between">
            <Link href="/admin/settings">
              <span>System Settings</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="tonal" className="rounded-lg px-6 py-4 h-auto text-label-large flex items-center justify-between">
            <Link href="/workbench/pathway-templates">
              <span>View Pathway Templates</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}