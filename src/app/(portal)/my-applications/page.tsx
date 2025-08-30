import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function MyApplicationsPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" /> My Applications
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            View the status and details of your submitted applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground">
          <p>This page will list all applications you have submitted, along with their current status and progress.</p>
          <p className="mt-2">Coming soon: Application list, status tracking, and direct links to application details.</p>
        </CardContent>
      </Card>
    </div>
  );
}