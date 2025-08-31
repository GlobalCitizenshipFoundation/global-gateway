"use client";

import React from "react";
import { CampaignPhase } from "../services/campaign-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Import configuration components from pathways, as they are reusable
import { FormPhaseConfig } from "@/features/pathways/components/phase-configs/FormPhaseConfig";
import { ReviewPhaseConfig } from "@/features/pathways/components/phase-configs/ReviewPhaseConfig";
import { EmailPhaseConfig } from "@/features/pathways/components/phase-configs/EmailPhaseConfig";
import { SchedulingPhaseConfig } from "@/features/pathways/components/phase-configs/SchedulingPhaseConfig";
import { DecisionPhaseConfig } from "@/features/pathways/components/phase-configs/DecisionPhaseConfig";
import { RecommendationPhaseConfig } from "@/features/pathways/components/phase-configs/RecommendationPhaseConfig";
import { updateCampaignPhaseConfigAction } from "../actions"; // Campaign-specific action
import { BaseConfigurableItem } from "@/types/supabase"; // Import BaseConfigurableItem
import { ScreeningPhaseConfig } from "@/features/pathways/components/phase-configs/ScreeningPhaseConfig"; // Import ScreeningPhaseConfig

interface CampaignPhaseConfigurationPanelProps {
  phase: CampaignPhase;
  campaignId: string;
  onConfigSaved: () => void;
  onCancel: () => void; // Added onCancel prop
  canModify: boolean;
}

export function CampaignPhaseConfigurationPanel({
  phase,
  campaignId,
  onConfigSaved,
  onCancel, // Destructure onCancel
  canModify,
}: CampaignPhaseConfigurationPanelProps) {
  // Wrapper function to adapt the existing config components to use campaign-specific action
  const handleConfigUpdate = async (phaseId: string, parentId: string, configUpdates: Record<string, any>): Promise<BaseConfigurableItem | null> => {
    // The parentId passed to this wrapper is actually the campaignId, which is already available.
    // The config components expect a parentId, so we pass the campaignId.
    return await updateCampaignPhaseConfigAction(phaseId, campaignId, configUpdates);
  };

  const renderConfigComponent = () => {
    switch (phase.type) {
      case "Form":
        return (
          <FormPhaseConfig
            phase={phase}
            parentId={campaignId} // Pass campaignId as parentId
            onConfigSaved={onConfigSaved}
            onCancel={onCancel} // Pass onCancel
            canModify={canModify}
            // Override the default update action with the campaign-specific one
            updatePhaseConfigAction={handleConfigUpdate}
          />
        );
      case "Review":
        return (
          <ReviewPhaseConfig
            phase={phase}
            parentId={campaignId}
            onConfigSaved={onConfigSaved}
            onCancel={onCancel} // Pass onCancel
            canModify={canModify}
            updatePhaseConfigAction={handleConfigUpdate}
          />
        );
      case "Email":
        return (
          <EmailPhaseConfig
            phase={phase}
            parentId={campaignId}
            onConfigSaved={onConfigSaved}
            onCancel={onCancel} // Pass onCancel
            canModify={canModify}
            updatePhaseConfigAction={handleConfigUpdate}
          />
        );
      case "Scheduling":
        return (
          <SchedulingPhaseConfig
            phase={phase}
            parentId={campaignId}
            onConfigSaved={onConfigSaved}
            onCancel={onCancel} // Pass onCancel
            canModify={canModify}
            updatePhaseConfigAction={handleConfigUpdate}
          />
        );
      case "Decision":
        return (
          <DecisionPhaseConfig
            phase={phase}
            parentId={campaignId}
            onConfigSaved={onConfigSaved}
            onCancel={onCancel} // Pass onCancel
            canModify={canModify}
            updatePhaseConfigAction={handleConfigUpdate}
          />
        );
      case "Recommendation":
        return (
          <RecommendationPhaseConfig
            phase={phase}
            parentId={campaignId}
            onConfigSaved={onConfigSaved}
            onCancel={onCancel} // Pass onCancel
            canModify={canModify}
            updatePhaseConfigAction={handleConfigUpdate}
          />
        );
      case "Screening": // Added ScreeningPhaseConfig
        return (
          <ScreeningPhaseConfig
            phase={phase}
            parentId={campaignId}
            onConfigSaved={onConfigSaved}
            onCancel={onCancel} // Pass onCancel
            canModify={canModify}
            updatePhaseConfigAction={handleConfigUpdate}
          />
        );
      default:
        return (
          <Card className="rounded-xl shadow-md p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-headline-small text-muted-foreground">
                No Configuration Available
              </CardTitle>
              <CardDescription className="text-body-medium text-muted-foreground">
                The campaign phase type &quot;{phase.type}&quot; does not currently have a dedicated configuration interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 text-body-small text-muted-foreground">
              <p>Please check back later for updates or contact support for custom configurations.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-title-large font-bold text-foreground">Configure {phase.name} ({phase.type})</h3>
      {renderConfigComponent()}
    </div>
  );
}