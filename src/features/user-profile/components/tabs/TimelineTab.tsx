"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export function TimelineTab() {
  return (
    <Card className="rounded-xl shadow-md p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" /> Timeline / History
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          A chronological list of your engagements and campaign participations.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-body-medium text-muted-foreground">
          No history available yet. As you engage with campaigns and programs, your activities will appear here.
        </p>
      </CardContent>
    </Card>
  );
}