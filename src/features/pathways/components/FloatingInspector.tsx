"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Phase } from "../services/pathway-template-service";
import { PhaseDetailsForm } from "./PhaseDetailsForm";
import { PhaseConfigurationPanel } from "./PhaseConfigurationPanel";
import { PhaseTaskManagementPanel } from "./PhaseTaskManagementPanel";
import { BranchingConfigForm } from "./BranchingConfigForm";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FloatingInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  phase: Phase | null;
  pathwayTemplateId: string;
  onConfigSaved: () => void;
  canModify: boolean;
}

export function FloatingInspector({
  isOpen,
  onClose,
  phase,
  pathwayTemplateId,
  onConfigSaved,
  canModify,
}: FloatingInspectorProps) {
  const isConditional = phase?.type === "Decision" || phase?.type === "Review";

  if (!phase) return null;

  const handleSaveAndClose = () => {
    onConfigSaved(); // Trigger parent refresh
    onClose(); // Close the inspector
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-headline-small">
            Configure Phase: {phase.name} ({phase.type})
          </DialogTitle>
          <DialogDescription className="text-body-medium text-muted-foreground">
            Adjust the details, configuration, tasks, and branching for this phase.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow p-4 -mx-4"> {/* Added negative margin to offset padding from DialogContent */}
          <div className="space-y-8">
            {/* Phase Details Form */}
            <PhaseDetailsForm
              pathwayTemplateId={pathwayTemplateId}
              initialData={phase}
              onPhaseSaved={handleSaveAndClose}
              onCancel={onClose} // Cancel button in form will close inspector
              nextOrderIndex={phase.order_index} // Not relevant for editing, but required prop
              canModify={canModify}
            />

            <Separator className="my-4" />

            {/* Phase Type-Specific Configuration */}
            <PhaseConfigurationPanel
              phase={phase}
              parentId={pathwayTemplateId}
              onConfigSaved={handleSaveAndClose}
              canModify={canModify}
            />

            <Separator className="my-4" />

            {/* Phase Task Management */}
            <PhaseTaskManagementPanel
              phaseId={phase.id}
              pathwayTemplateId={pathwayTemplateId}
              canModify={canModify}
            />

            {/* Branching Configuration (Conditional) */}
            {isConditional && (
              <>
                <Separator className="my-4" />
                <BranchingConfigForm
                  pathwayTemplateId={pathwayTemplateId}
                  phase={phase}
                  onConfigSaved={handleSaveAndClose}
                  canModify={canModify}
                />
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}