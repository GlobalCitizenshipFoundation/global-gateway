"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle2, CheckCircle, XCircle, Info, Edit, Trash2 } from "lucide-react";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Decision } from "../services/evaluation-service";
import { getDecisionsAction, deleteDecisionAction } from "../actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface DecisionListProps {
  applicationId: string;
  canModifyDecisions: boolean;
  onDecisionModified: () => void;
  onEditDecision: (decision: Decision) => void;
}

export function DecisionList({
  applicationId,
  canModifyDecisions,
  onDecisionModified,
  onEditDecision,
}: DecisionListProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoadingDecisions, setIsLoadingDecisions] = useState(true);

  const fetchDecisions = async () => {
    setIsLoadingDecisions(true);
    try {
      const fetchedDecisions = await getDecisionsAction(applicationId);
      if (fetchedDecisions) {
        setDecisions(fetchedDecisions);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load decisions.");
    } finally {
      setIsLoadingDecisions(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchDecisions();
    }
  }, [user, isSessionLoading, applicationId]);

  const handleDelete = async (decisionId: string) => {
    try {
      const success = await deleteDecisionAction(decisionId);
      if (success) {
        toast.success("Decision deleted successfully!");
        fetchDecisions();
        onDecisionModified();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete decision.");
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case "accepted": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-600" />;
      case "waitlist": return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case "accepted": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "waitlist": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  const getUserInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small font-bold text-foreground">Application Decisions</CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          All recorded decisions for this application.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        {isLoadingDecisions ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {decisions.length === 0 ? (
              <p className="text-body-medium text-muted-foreground text-center">No decisions recorded yet.</p>
            ) : (
              decisions.map((decision) => {
                const deciderName = `${decision.profiles?.first_name || ''} ${decision.profiles?.last_name || ''}`.trim() || "Unknown Decider";
                const isDecider = user?.id === decision.decider_id;
                const canModifyThisDecision = canModifyDecisions && (isDecider || user?.user_metadata?.role === 'admin');

                return (
                  <div key={decision.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={decision.profiles?.avatar_url || ""} alt={deciderName} />
                      <AvatarFallback className="bg-tertiary-container text-on-tertiary-container text-label-small">
                        {getUserInitials(decision.profiles?.first_name, decision.profiles?.last_name) || <UserCircle2 className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-label-large font-medium text-foreground">
                          {deciderName}
                          {isDecider && <span className="ml-2 text-body-small text-muted-foreground">(You)</span>}
                        </p>
                        <span className="text-body-small text-muted-foreground">
                          {new Date(decision.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full w-fit mb-2", getOutcomeColor(decision.outcome))}>
                        {getOutcomeIcon(decision.outcome)}
                        <span className="font-medium text-body-small">Outcome: {decision.outcome}</span>
                      </div>
                      {decision.notes && (
                        <p className="text-body-medium text-foreground break-words whitespace-pre-wrap mt-1">{decision.notes}</p>
                      )}
                      {decision.is_final && (
                        <p className="text-body-small text-primary font-medium mt-1">
                          Final Decision
                        </p>
                      )}
                      {decision.created_at !== decision.updated_at && (
                        <p className="text-body-small text-muted-foreground mt-1">
                          (Edited: {new Date(decision.updated_at).toLocaleString()})
                        </p>
                      )}
                      {canModifyThisDecision && (
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => onEditDecision(decision)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Decision</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Decision</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-headline-small">Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription className="text-body-medium text-muted-foreground">
                                  Are you sure you want to delete this decision? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(decision.id)}
                                  className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}