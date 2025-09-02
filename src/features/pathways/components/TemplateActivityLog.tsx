"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, UserCircle2, Clock } from "lucide-react";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplateActivityLogs } from "../services/template-activity-log-service";
import { TemplateActivityLog as TemplateActivityLogType } from "../services/template-activity-log-types";
import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTemplateBuilder } from "../context/TemplateBuilderContext"; // Import context

interface TemplateActivityLogProps {
  templateId: string;
  refreshTrigger: number; // New prop to trigger refresh
}

export function TemplateActivityLog({ templateId, refreshTrigger }: TemplateActivityLogProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const { canModifyTemplate } = useTemplateBuilder(); // Consume context
  const effectiveCanModify = canModifyTemplate; // Use context value

  const [activityLogs, setActivityLogs] = useState<TemplateActivityLogType[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const fetchActivityLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const fetchedLogs = await getTemplateActivityLogs(templateId);
      if (fetchedLogs) {
        setActivityLogs(fetchedLogs);
      }
    } catch (error: any) {
      console.error("Error fetching activity logs:", error.message);
      // toast.error(error.message || "Failed to load activity logs."); // Removed toast to avoid spamming
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchActivityLogs();
    }
  }, [user, isSessionLoading, templateId, refreshTrigger]); // Added refreshTrigger to dependencies

  const getUserInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  if (isLoadingLogs) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" /> Activity Log
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          A chronological record of all changes and events for this template.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        {activityLogs.length === 0 ? (
          <p className="text-body-medium text-muted-foreground text-center">No activity recorded yet.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={log.profiles?.avatar_url || ""} alt={log.profiles?.first_name || "User"} />
                  <AvatarFallback className="bg-primary-container text-on-primary-container text-label-small">
                    {getUserInitials(log.profiles?.first_name, log.profiles?.last_name) || <UserCircle2 className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-label-large font-medium text-foreground">
                      {log.profiles?.first_name} {log.profiles?.last_name || "Unknown User"}
                    </p>
                    <span className="text-body-small text-muted-foreground">
                      {format(parseISO(log.created_at), "PPP p")}
                    </span>
                  </div>
                  <p className="text-body-medium text-foreground break-words whitespace-pre-wrap">{log.description}</p>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="text-body-small text-muted-foreground mt-2 cursor-pointer">
                      <summary className="font-medium">Details</summary>
                      <pre className="whitespace-pre-wrap text-xs bg-background p-2 rounded-md mt-1 border border-border">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}