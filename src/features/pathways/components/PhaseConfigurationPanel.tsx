"use client";

import React from "react";
import { BaseConfigurableItem } from "../services/pathway-template-service";
import { FormPhaseConfig } from "./phase-configs/FormPhaseConfig";
import { ReviewPhaseConfig } from "./phase-configs/ReviewPhaseConfig";
import { EmailPhaseConfig } from "./phase-configs/EmailPhaseConfig";
import { SchedulingPhaseConfig } from "./phase-configs/SchedulingPhaseConfig";
import { DecisionPhaseConfig } from "./phase-configs/DecisionPhaseConfig";
import { RecommendationPhaseConfig } from "./phase-configs/RecommendationPhaseConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhaseTaskManagementPanel } from "./PhaseTaskManagementPanel"; // Import new task panel
import { Separator } from "@/components/ui/separator"; // Import Separator

interface PhaseConfigurationPanelProps {
  phase: BaseConfigurableItem;
  parentId: string; // This is pathwayTemplateId for pathway templates
  onConfigSaved: () => void;
  canModify: boolean;
}

export function PhaseConfigurationPanel({
  phase,
  parentId,
  onConfigSaved,
  canModify,
}: PhaseConfigurationPanelProps) {
  const renderConfigComponent = () => {
    switch (phase.type) {
      case "Form":
        return (
          <FormPhaseConfig
            phase={phase}
            parentId={parentId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Review":
        return (
          <ReviewPhaseConfig
            phase={phase}
            parentId={parentId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Email":
        return (
          <EmailPhaseConfig
            phase={phase}
            parentId={parentId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Scheduling":
        return (
          <SchedulingPhaseConfig
            phase={phase}
            parentId={parentId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Decision":
        return (
          <DecisionPhaseConfig
            phase={phase}
            parentId={parentId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Recommendation":
        return (
          <RecommendationPhaseConfig
            phase={phase}
            parentId={parentId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
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
                The phase type &quot;{phase.type}&quot; does not currently have a dedicated configuration interface.
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

      <Separator className="my-8" />

      {/* Generic Phase Task Management */}
      <PhaseTaskManagementPanel
        phaseId={phase.id}
        pathwayTemplateId={parentId} // Pass parentId as pathwayTemplateId for authorization
        canModify={canModify}
      />
    </div>
  );
}