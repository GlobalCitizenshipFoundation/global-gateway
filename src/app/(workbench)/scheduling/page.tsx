import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function SchedulingDashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary" /> Scheduling Dashboard
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            Manage interview schedules, host availability, and applicant bookings.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground">
          <p>This dashboard will centralize all scheduling-related tasks for campaigns.</p>
          <p className="mt-2">Coming soon: Calendar views, booking management, and host availability tools.</p>
        </CardContent>
      </Card>
    </div>
  );
}