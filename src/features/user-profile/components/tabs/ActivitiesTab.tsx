"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export function ActivitiesTab() {
  return (
    <Card className="rounded-xl shadow-md p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" /> Activities
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          A list of your recent activities and updates related to campaign participation.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-body-medium text-muted-foreground">
          No recent activities to show.
        </p>
      </CardContent>
    </Card>
  );
}