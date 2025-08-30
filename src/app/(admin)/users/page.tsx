import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> User Management
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            Manage all users, roles, and permissions across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground">
          <p>This page will contain tools for viewing, editing, and managing user accounts.</p>
          <p className="mt-2">Coming soon: User tables, role assignment, and account actions.</p>
        </CardContent>
      </Card>
    </div>
  );
}