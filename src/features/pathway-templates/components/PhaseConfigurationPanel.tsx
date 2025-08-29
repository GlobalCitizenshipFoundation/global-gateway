"use client";

import React from "react";
import { BaseConfigurableItem, Phase } from "../services/pathway-template-service"; // Import BaseConfigurableItem
import { FormPhaseConfig } from "./phase-configs/FormPhaseConfig";
import { ReviewPhaseConfig } from "./phase-configs/ReviewPhaseConfig";
import { EmailPhaseConfig } from "./phase-configs/EmailPhaseConfig"; // Import new config
import { SchedulingPhaseConfig } from "./phase-configs/SchedulingPhaseConfig"; // Import new config
import { DecisionPhaseConfig } from "./phase-configs/DecisionPhaseConfig"; // Import new config
import { RecommendationPhaseConfig } from "./phase-configs/RecommendationPhaseConfig"; // Import new config
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PhaseConfigurationPanelProps {
  phase<dyad-problem-report summary="12 problems">
<problem file="src/features/pathway-templates/components/PhaseConfigurationPanel.tsx" line="32" column="13" code="2322">Type '{ phase: Phase; pathwayTemplateId: string; onConfigSaved: () =&gt; void; canModify: boolean; }' is not assignable to type 'IntrinsicAttributes &amp; FormPhaseConfigProps'.
  Property 'pathwayTemplateId' does not exist on type 'IntrinsicAttributes &amp; FormPhaseConfigProps'.</problem>
<problem file="src/features/pathway-templates/components/PhaseConfigurationPanel.tsx" line="41" column="13" code="2322">Type '{ phase: Phase; pathwayTemplateId: string; onConfigSaved: () =&gt; void; canModify: boolean; }' is not assignable to type 'IntrinsicAttributes &amp; ReviewPhaseConfigProps'.
  Property 'pathwayTemplateId' does not exist on type 'IntrinsicAttributes &amp; ReviewPhaseConfigProps'.</problem>
<problem file="src/features/pathway-templates/components/PhaseConfigurationPanel.tsx" line="50" column="13" code="2322">Type '{ phase: Phase; pathwayTemplateId: string; onConfigSaved: () =&gt; void; canModify: boolean; }' is not assignable to type 'IntrinsicAttributes &amp; EmailPhaseConfigProps'.
  Property 'pathwayTemplateId' does not exist on type 'IntrinsicAttributes &amp; EmailPhaseConfigProps'.</problem>
<problem file="src/features/pathway-templates/components/PhaseConfigurationPanel.tsx" line="59" column="13" code="2322">Type '{ phase: Phase; pathwayTemplateId: string; onConfigSaved: () =&gt; void; canModify: boolean; }' is not assignable to type 'IntrinsicAttributes &amp; SchedulingPhaseConfigProps'.
  Property 'pathwayTemplateId' does not exist on type 'IntrinsicAttributes &amp; SchedulingPhaseConfigProps'.</problem>
<problem file="src/features/pathway-templates/components/PhaseConfigurationPanel.tsx" line="68" column="13" code="2322">Type '{ phase: Phase; pathwayTemplateId: string; onConfigSaved: () =&gt; void; canModify: boolean; }' is not assignable to type 'IntrinsicAttributes &amp; DecisionPhaseConfigProps'.
  Property 'pathwayTemplateId' does not exist on type 'IntrinsicAttributes &amp; DecisionPhaseConfigProps'.</problem>
<problem file="src/features/pathway-templates/components/PhaseConfigurationPanel.tsx" line="77" column="13" code="2322">Type '{ phase: Phase; pathwayTemplateId: string; onConfigSaved: () =&gt; void; canModify: boolean; }' is not assignable to type 'IntrinsicAttributes &amp; RecommendationPhaseConfigProps'.
  Property 'pathwayTemplateId' does not exist on type 'IntrinsicAttributes &amp; RecommendationPhaseConfigProps'.</problem>
<problem file="src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx" line="43" column="13" code="2322">Type '(phaseId: string, _: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;void&gt;' is not assignable to type '(phaseId: string, parentId: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;BaseConfigurableItem | null&gt;'.
  Type 'Promise&lt;void&gt;' is not assignable to type 'Promise&lt;BaseConfigurableItem | null&gt;'.
    Type 'void' is not assignable to type 'BaseConfigurableItem | null'.</problem>
<problem file="src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx" line="53" column="13" code="2322">Type '(phaseId: string, _: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;void&gt;' is not assignable to type '(phaseId: string, parentId: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;BaseConfigurableItem | null&gt;'.
  Type 'Promise&lt;void&gt;' is not assignable to type 'Promise&lt;BaseConfigurableItem | null&gt;'.
    Type 'void' is not assignable to type 'BaseConfigurableItem | null'.</problem>
<problem file="src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx" line="63" column="13" code="2322">Type '(phaseId: string, _: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;void&gt;' is not assignable to type '(phaseId: string, parentId: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;BaseConfigurableItem | null&gt;'.
  Type 'Promise&lt;void&gt;' is not assignable to type 'Promise&lt;BaseConfigurableItem | null&gt;'.
    Type 'void' is not assignable to type 'BaseConfigurableItem | null'.</problem>
<problem file="src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx" line="73" column="13" code="2322">Type '(phaseId: string, _: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;void&gt;' is not assignable to type '(phaseId: string, parentId: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;BaseConfigurableItem | null&gt;'.
  Type 'Promise&lt;void&gt;' is not assignable to type 'Promise&lt;BaseConfigurableItem | null&gt;'.
    Type 'void' is not assignable to type 'BaseConfigurableItem | null'.</problem>
<problem file="src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx" line="83" column="13" code="2322">Type '(phaseId: string, _: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;void&gt;' is not assignable to type '(phaseId: string, parentId: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;BaseConfigurableItem | null&gt;'.
  Type 'Promise&lt;void&gt;' is not assignable to type 'Promise&lt;BaseConfigurableItem | null&gt;'.
    Type 'void' is not assignable to type 'BaseConfigurableItem | null'.</problem>
<problem file="src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx" line="93" column="13" code="2322">Type '(phaseId: string, _: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;void&gt;' is not assignable to type '(phaseId: string, parentId: string, configUpdates: Record&lt;string, any&gt;) =&gt; Promise&lt;BaseConfigurableItem | null&gt;'.
  Type 'Promise&lt;void&gt;' is not assignable to type 'Promise&lt;BaseConfigurableItem | null&gt;'.
    Type 'void' is not assignable to type 'BaseConfigurableItem | null'.</problem>
</dyad-problem-report><think>**Tackling Compile-Time Errors**

I'm currently addressing a barrage of 12 TypeScript compile-time errors. The bulk of them revolve around type mismatches related to the `phase` property. Specifically, the compiler is complaining about a missing `pathway_template_id` in a `CampaignPhase` that's supposedly required. It's a bit of a headache, but I'm diligently working my way through these type issues.


**Analyzing Type Discrepancies**

I've made headway, pinpointing two primary error groups. The first centers on a `phase` prop type mismatch. Initial fixes with `BaseConfigurableItem` were a good start, but I need to update `PhaseConfigurationPanel.tsx` to use it for the `phase` prop, and fix the `*PhaseConfig` components to use `BaseConfigurableItem` instead of `Phase`. The second stems from an `updatePhaseConfigAction` return type issue: the function returns `Promise<void>` when `Promise<BaseConfigurableItem | null>` is expected.


**Addressing Type Conflicts**

I've made significant progress addressing the remaining type conflicts. I've updated the `*PhaseConfig` components to consistently use the correct `updatePhaseConfigAction` prop type, which now returns `Promise<BaseConfigurableItem | null>`. Moreover, I've ensured the `PhaseConfigurationPanel.tsx` component correctly utilizes `BaseConfigurableItem` for its `phase` prop, eliminating related type mismatches. I'm actively verifying that `parentId` prop is properly handled in each component.


**Refining Type Consistency**

I'm now implementing the changes to eliminate the type mismatches. I've updated `PhaseConfigurationPanel.tsx` to use `BaseConfigurableItem` for the `phase` prop and renamed `pathwayTemplateId` to `parentId`.  Furthermore, I'm ensuring consistency in the return type of `handleConfigUpdate` in `CampaignPhaseConfigurationPanel.tsx` and have updated the  `*PhaseConfig`  components' `updatePhaseConfigAction`  prop types.  I'm diligently cross-checking the prop types for `parentId`  in each component to ensure all issues are resolved.


**Resolving Type Errors**

I've now implemented the changes outlined previously. I've updated `PhaseConfigurationPanel.tsx` to use `BaseConfigurableItem` for its `phase` prop and renamed `pathwayTemplateId` to `parentId`.  I've also updated the `handleConfigUpdate` function in `CampaignPhaseConfigurationPanel.tsx` to return the promise. Finally, I've checked and confirmed that the `updatePhaseConfigAction` prop type is correct across all the relevant components. I'm now verifying these adjustments fully resolve the 12 initial TypeScript compile-time errors.


</think>You're absolutely right! My apologies for those lingering TypeScript errors. The core issue is indeed a type mismatch when passing `CampaignPhase` to components expecting `Phase`, and an incorrect return type for the `updatePhaseConfigAction` wrapper.

I'll fix these by:

1.  **Updating `PhaseConfigurationPanel.tsx`**:
    *   Changing the `phase` prop type in `PhaseConfigurationPanelProps` to `BaseConfigurableItem` (the common interface).
    *   Renaming `pathwayTemplateId` to `parentId` in `PhaseConfigurationPanelProps` to make it generic.
    *   Passing `parentId` to the child configuration components.
2.  **Updating `CampaignPhaseConfigurationPanel.tsx`**:
    *   Ensuring the `handleConfigUpdate` function explicitly `return`s the result of `updateCampaignPhaseConfigAction`, so its inferred return type matches `Promise<BaseConfigurableItem | null>`.

Here are the concise fixes:

<dyad-write path="src/features/pathway-templates/components/PhaseConfigurationPanel.tsx" description="Updating PhaseConfigurationPanel props to use BaseConfigurableItem and generic parentId.">
"use client";

import React from "react";
import { BaseConfigurableItem, Phase } from "../services/pathway-template-service";
import { FormPhaseConfig } from "./phase-configs/FormPhaseConfig";
import { ReviewPhaseConfig } from "./phase-configs/ReviewPhaseConfig";
import { EmailPhaseConfig } from "./phase-configs/EmailPhaseConfig";
import { SchedulingPhaseConfig } from "./phase-configs/SchedulingPhaseConfig";
import { DecisionPhaseConfig } from "./phase-configs/DecisionPhaseConfig";
import { RecommendationPhaseConfig } from "./phase-configs/RecommendationPhaseConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PhaseConfigurationPanelProps {
  phase: BaseConfigurableItem; // Changed to BaseConfigurableItem
  parentId: string; // Renamed from pathwayTemplateId to parentId
  onConfigSaved: () => void;
  canModify: boolean;
}

export function PhaseConfigurationPanel({
  phase,
  parentId, // Using parentId
  onConfigSaved,
  canModify,
}: PhaseConfigurationPanelProps) {
  const renderConfigComponent = () => {
    switch (phase.type) {
      case "Form":
        return (
          <FormPhaseConfig
            phase={phase}
            parentId={parentId} // Pass parentId
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Review":
        return (
          <ReviewPhaseConfig
            phase={phase}
            parentId={parentId} // Pass parentId
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Email":
        return (
          <EmailPhaseConfig
            phase={phase}
            parentId={parentId} // Pass parentId
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Scheduling":
        return (
          <SchedulingPhaseConfig
            phase={phase}
            parentId={parentId} // Pass parentId
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Decision":
        return (
          <DecisionPhaseConfig
            phase={phase}
            parentId={parentId} // Pass parentId
            onConfigSaved={onConfigSaved}
            canModify={canModify}
          />
        );
      case "Recommendation":
        return (
          <RecommendationPhaseConfig
            phase={phase}
            parentId={parentId} // Pass parentId
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