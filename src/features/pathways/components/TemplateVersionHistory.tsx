"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, RotateCcw, Eye, GitFork, Clock, Archive } from "lucide-react";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { PathwayTemplateVersion } from "../services/template-versioning-service";
import { getTemplateVersionsAction, rollbackTemplateToVersionAction } from "../actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { useTemplateBuilder } from "../context/TemplateBuilderContext"; // Removed context import

interface TemplateVersionHistoryProps {
  pathwayTemplateId: string;
  canModify: boolean; // Now explicitly a prop
  onTemplateRolledBack: () => void;
  refreshTrigger: number;
}

export function TemplateVersionHistory({ pathwayTemplateId, canModify, onTemplateRolledBack, refreshTrigger }: TemplateVersionHistoryProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  // const { canModifyTemplate } = useTemplateBuilder(); // Removed context consumption
  // const effectiveCanModify = canModifyTemplate; // Removed context consumption
  const effectiveCanModify = canModify; // Use prop directly

  const [versions, setVersions] = useState<PathwayTemplateVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);
  const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState(false);
  const [viewingSnapshot, setViewingSnapshot] = useState<PathwayTemplateVersion['snapshot'] | null>(null);

  const fetchVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const fetchedVersions = await getTemplateVersionsAction(pathwayTemplateId);
      if (fetchedVersions) {
        setVersions(fetchedVersions);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load template versions.");
    } finally {
      setIsLoadingVersions(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchVersions();
    }
  }, [user, isSessionLoading, pathwayTemplateId, refreshTrigger]);

  const handleRollback = async (versionId: string, versionNumber: number) => {
    try {
      const rolledBackTemplate = await rollbackTemplateToVersionAction(pathwayTemplateId, versionId);
      if (rolledBackTemplate) {
        toast.success(`Template rolled back to version ${versionNumber} successfully!`);
        onTemplateRolledBack();
        fetchVersions();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to rollback template.");
    }
  };

  const handleViewSnapshot = (snapshot: PathwayTemplateVersion['snapshot']) => {
    setViewingSnapshot(snapshot);
    setIsSnapshotDialogOpen(true);
  };

  if (isLoadingVersions) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const getUserInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" /> Version History
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Review and manage past versions of this pathway template.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        {versions.length === 0 ? (
          <p className="text-body-medium text-muted-foreground text-center">No versions saved yet.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {versions.map((version) => (
              <Card key={version.id} className="rounded-lg border p-4 flex items-center justify-between">
                <div>
                  <p className="text-title-medium font-medium text-foreground">
                    Version {version.version_number}
                    {version.version_number === versions[0].version_number && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container text-label-small">Current</span>
                    )}
                  </p>
                  <p className="text-body-small text-muted-foreground flex items-center gap-1 mt-1">
                    <GitFork className="h-4 w-4" />
                    Created by: {version.profiles?.first_name} {version.profiles?.last_name || "Unknown User"}
                  </p>
                  <p className="text-body-small text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    On: {format(parseISO(version.created_at), "PPP p")}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" className="rounded-md" onClick={() => handleViewSnapshot(version.snapshot)}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View Snapshot</span>
                  </Button>
                  {effectiveCanModify && version.version_number !== versions[0].version_number && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="tonal" size="icon" className="rounded-md">
                          <RotateCcw className="h-4 w-4" />
                          <span className="sr-only">Rollback</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-headline-small">Confirm Rollback</AlertDialogTitle>
                          <AlertDialogDescription className="text-body-medium text-muted-foreground">
                            Are you sure you want to rollback to version {version.version_number}? This will overwrite the current template and its phases.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRollback(version.id, version.version_number)}
                            className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Rollback
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isSnapshotDialogOpen} onOpenChange={setIsSnapshotDialogOpen}>
        <DialogContent className="sm:max-w-[900px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-headline-small">Template Version Snapshot</DialogTitle>
            <DialogDescription className="text-body-medium text-muted-foreground">
              Read-only view of the template and its phases at this version.
            </DialogDescription>
          </DialogHeader>
          {viewingSnapshot && (
            <ScrollArea className="h-[70vh] p-4 border rounded-md bg-muted/10">
              <h3 className="text-title-large font-bold text-foreground mb-2">Template Details</h3>
              <p className="text-body-medium"><strong>Name:</strong> {viewingSnapshot.template.name}</p>
              <p className="text-body-medium"><strong>Description:</strong> {viewingSnapshot.template.description || "N/A"}</p>
              <p className="text-body-medium"><strong>Private:</strong> {viewingSnapshot.template.is_private ? "Yes" : "No"}</p>

              <h3 className="text-title-large font-bold text-foreground mt-6 mb-2">Phases</h3>
              {viewingSnapshot.phases.length === 0 ? (
                <p className="text-body-medium text-muted-foreground">No phases in this version.</p>
              ) : (
                <div className="space-y-4">
                  {viewingSnapshot.phases.map((phase, index) => (
                    <Card key={phase.id} className="rounded-lg border p-3">
                      <p className="text-title-medium font-medium text-foreground">
                        {index + 1}. {phase.name} ({phase.type})
                      </p>
                      <p className="text-body-small text-muted-foreground">Description: {phase.description || "N/A"}</p>
                      <p className="text-body-small text-muted-foreground">Config: <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded-md mt-1">{JSON.stringify(phase.config, null, 2)}</pre></p>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}