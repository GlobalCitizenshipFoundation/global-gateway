"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function ApplicationsTab() {
  return (
    <Card className="rounded-xl shadow-md p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Applications
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          View your active and past application submissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-body-medium text-muted-foreground">
          No applications to display yet. Start exploring campaigns to apply!
        </p>
      </CardContent>
    </Card>
  );
}