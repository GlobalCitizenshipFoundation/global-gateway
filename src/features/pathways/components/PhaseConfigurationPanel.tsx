"use client";

import React from "react";
import { BaseConfigurableItem } from "../services/pathway-template-service";
import { FormPhaseConfig } from "./phase-configs/FormPhaseConfig";
import { ReviewPhaseConfig } from "./phase-configs/ReviewPhaseConfig";
import { EmailPhaseConfig } from "./phase-configs/EmailPhaseConfig";
import { SchedulingPhaseConfig } from "./phase-configs/SchedulingPhaseConfig";
import { DecisionPhaseConfig } from "./phase-configs/DecisionPhaseConfig";
import { RecommendationPhaseConfig } from "./phase-configs/RecommendationPhaseConfig";
import { ScreeningPhaseConfig } from "./phase-configs/ScreeningPhaseConfig"; // Import new ScreeningPhaseConfig
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
      case "Screening": // New case for Screening phase
        return (
          <ScreeningPhaseConfig
            phase={phase}
            parentId={parentId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      default:
        return (
          <div className="rounded-xl shadow-md p-6 bg-muted/20 border border-border">
            <h4 className="text-headline-small text-muted-foreground">
              No Configuration Available
            </h4>
            <p className="text-body-medium text-muted-foreground mt-2">
              The phase type &quot;{phase.type}&quot; does not currently have a dedicated configuration interface.
            </p>
            <p className="text-body-small text-muted-foreground mt-1">
              Please check back later for updates or contact support for custom configurations.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-title-large font-bold text-foreground">Phase Configuration</h3>
      {renderConfigComponent()}
    </div>
  );
}