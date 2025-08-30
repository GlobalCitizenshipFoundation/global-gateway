import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary" /> System Settings
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            Configure global platform settings and integrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground">
          <p>This page will allow administrators to manage system-wide configurations.</p>
          <p className="mt-2">Coming soon: Email integration settings, security policies, and general platform preferences.</p>
        </CardContent>
      </Card>
    </div>
  );
}