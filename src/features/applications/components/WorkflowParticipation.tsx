"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, CircleDashed, Loader2, XCircle } from "lucide-react";
import { CampaignPhase } from "@/features/campaigns/services/campaign-service";
import { getCampaignPhasesAction } from "@/features/campaigns/actions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WorkflowParticipationProps {
  campaignId: string;
  currentCampaignPhaseId: string | null;
  applicationOverallStatus: string; // e.g., 'submitted', 'in_review', 'accepted', 'rejected'
}

export function WorkflowParticipation({
  campaignId,
  currentCampaignPhaseId,
  applicationOverallStatus,
}: WorkflowParticipationProps) {
  const [phases, setPhases] = useState<CampaignPhase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPhases = async () => {
      setIsLoading(true);
      try {
        const fetchedPhases = await getCampaignPhasesAction(campaignId);
        if (fetchedPhases) {
          setPhases(fetchedPhases);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load campaign workflow.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPhases();
  }, [campaignId]);

  const getPhaseStatus = (phase: CampaignPhase) => {
    const isCurrentPhase = phase.id === currentCampaignPhaseId;
    const currentPhaseIndex = phases.findIndex((p: CampaignPhase) => p.id === currentCampaignPhaseId);
    const phaseIndex = phases.indexOf(phase);

    if (applicationOverallStatus === 'accepted' && phaseIndex <= currentPhaseIndex) {
      return { status: 'completed', icon: <CheckCircle className="h-5 w-5 text-green-600" /> };
    }
    if (applicationOverallStatus === 'rejected' && phaseIndex <= currentPhaseIndex) {
      return { status: 'rejected', icon: <XCircle className="h-5 w-5 text-red-600" /> };
    }
    if (isCurrentPhase) {
      return { status: 'in_progress', icon: <Loader2 className="h-5 w-5 animate-spin text-primary" /> };
    }
    if (phaseIndex < currentPhaseIndex) {
      return { status: 'completed', icon: <CheckCircle className="h-5 w-5 text-green-600" /> };
    }
    return { status: 'pending', icon: <CircleDashed className="h-5 w-5 text-muted-foreground" /> };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (phases.length === 0) {
    return (
      <p className="text-body-medium text-muted-foreground">
        No workflow phases defined for this campaign.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {phases.map((phase: CampaignPhase, index: number) => {
        const { status, icon } = getPhaseStatus(phase);
        const isCurrent = phase.id === currentCampaignPhaseId;

        return (
          <Card
            key={phase.id}
            className={cn(
              "rounded-xl shadow-sm p-4 flex items-center gap-4 transition-all duration-200",
              isCurrent ? "border-2 border-primary-container bg-primary-container/10" : "border border-border"
            )}
          >
            <div className="flex-shrink-0">
              {icon}
            </div>
            <div className="flex-grow">
              <CardTitle className="text-title-medium text-foreground">
                {phase.name}
              </CardTitle>
              <CardDescription className="text-body-small text-muted-foreground">
                {phase.description || `Phase Type: ${phase.type}`}
              </CardDescription>
            </div>
            <div className="flex-shrink-0 text-body-small font-medium capitalize">
              {status.replace('_', ' ')}
            </div>
          </Card>
        );
      })}
    </div>
  );
}