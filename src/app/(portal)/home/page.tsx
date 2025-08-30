import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, FileText, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PortalDashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <h1 className="text-display-small font-bold text-foreground">Applicant Portal Dashboard</h1>
      <p className="text-headline-small text-muted-foreground">Your central hub for all applications and profile management.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <FileText className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-headline-small text-foreground">My Applications</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CardDescription className="text-body-medium text-muted-foreground mt-1">View and manage your submitted applications.</CardDescription>
          </CardContent>
          <div className="mt-4">
            <Button asChild variant="tonal" className="w-full rounded-md">
              <Link href="/portal/my-applications">Go to Applications</Link>
            </Button>
          </div>
        </Card>

        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <UserCircle2 className="h-8 w-8 text-secondary mb-2" />
            <CardTitle className="text-headline-small text-foreground">My Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CardDescription className="text-body-medium text-muted-foreground mt-1">Update your personal and professional details.</CardDescription>
          </CardContent>
          <div className="mt-4">
            <Button asChild variant="tonal" className="w-full rounded-md">
              <Link href="/portal/profile">Edit Profile</Link>
            </Button>
          </div>
        </Card>

        <Card className="rounded-xl shadow-md p-6 flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <LayoutDashboard className="h-8 w-8 text-tertiary mb-2" />
            <CardTitle className="text-headline-small text-foreground">Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CardDescription className="text-body-medium text-muted-foreground mt-1">Explore available programs and campaigns.</CardDescription>
          </CardContent>
          <div className="mt-4">
            <Button asChild variant="tonal" className="w-full rounded-md">
              <Link href="/portal/campaigns">Browse Campaigns</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}