"use client";

import React from "react";
import { Phase } from "../services/pathway-template-service";
import { FormPhaseConfig } from "./phase-configs/FormPhaseConfig";
import { ReviewPhaseConfig } from "./phase-configs/ReviewPhaseConfig";
import { EmailPhaseConfig } from "./phase-configs/EmailPhaseConfig"; // Import new config
import { SchedulingPhaseConfig } from "./phase-configs/SchedulingPhaseConfig"; // Import new config
import { DecisionPhaseConfig } from "./phase-configs/DecisionPhaseConfig"; // Import new config
import { RecommendationPhaseConfig } from "./phase-configs/RecommendationPhaseConfig"; // Import new config
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PhaseConfigurationPanelProps {
  phase: Phase;
  pathwayTemplateId: string;
  onConfigSaved: () => void;
  canModify: boolean;
}

export function PhaseConfigurationPanel({
  phase,
  pathwayTemplateId,
  onConfigSaved,
  canModify,
}: PhaseConfigurationPanelProps) {
  const renderConfigComponent = () => {
    switch (phase.type) {
      case "Form":
        return (
          <FormPhaseConfig
            phase={phase}
            pathwayTemplateId={pathwayTemplateId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Review":
        return (
          <ReviewPhaseConfig
            phase={phase}
            pathwayTemplateId={pathwayTemplateId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Email":
        return (
          <EmailPhaseConfig
            phase={phase}
            pathwayTemplateId={pathwayTemplateId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Scheduling":
        return (
          <SchedulingPhaseConfig
            phase={phase}
            pathwayTemplateId={pathwayTemplateId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Decision":
        return (
          <DecisionPhaseConfig
            phase={phase}
            pathwayTemplateId={pathwayTemplateId}
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Recommendation":
        return (
          <RecommendationPhaseConfig
            phase={phase}
            pathwayTemplateId={pathwayTemplateId}
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
    </div>
  );
}