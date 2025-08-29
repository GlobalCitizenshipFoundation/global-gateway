"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export function MessagesTab() {
  return (
    <Card className="rounded-xl shadow-md p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small text-foreground flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" /> Messages
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          All communication threads with campaign organizers, recruiters, or program coordinators.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <p className="text-body-medium text-muted-foreground">
          No messages to display.
        </p>
      </CardContent>
    </Card>
  );
}