"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Settings, GitFork, FileText, Award, Mail, Calendar, MailCheck, Info, ExternalLink, ListChecks } from "lucide-react"; // Added ListChecks icon for Screening
import { Phase } from "../services/pathway-template-service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PhaseDetailsForm } from "./PhaseDetailsForm";
import { PhaseConfigurationPanel } from "./PhaseConfigurationPanel";
import { PhaseTaskManagementPanel } from "./PhaseTaskManagementPanel";
import { BranchingConfigForm } from "./BranchingConfigForm";

interface PhaseBuilderCardProps {
  phase: Phase;
  index: number;
  onDelete: (phaseId: string) => void;
  onPhaseUpdated: () => void; // Callback to refresh parent data
  canModify: boolean;
}

export function PhaseBuilderCard({ phase, index, onDelete, onPhaseUpdated, canModify }: PhaseBuilderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isConditional = phase.type === "Decision" || phase.type === "Review";

  // Determine icon based on phase type
  const getPhaseIcon = (type: string) => {
    switch (type) {
      case "Form": return <FileText className="h-8 w-8" />;
      case "Review": return <Award className="h-8 w-8" />;
      case "Email": return <Mail className="h-8 w-8" />;
      case "Scheduling": return <Calendar className="h-8 w-8" />;
      case "Decision": return <GitFork className="h-8 w-8" />;
      case "Recommendation": return <MailCheck className="h-8 w-8" />;
      case "Screening": return <ListChecks className="h-8 w-8" />; // Icon for Screening phase
      default: return <Info className="h-8 w-8" />;
    }
  };

  // Determine color classes based on phase type
  const getPhaseColorClasses = (type: string) => {
    switch (type) {
      case "Form": return "border-phase-form bg-phase-form-container text-on-phase-form-container";
      case "Review": return "border-phase-review bg-phase-review-container text-on-phase-review-container";
      case "Email": return "border-phase-email bg-phase-email-container text-on-phase-email-container";
      case "Scheduling": return "border-phase-scheduling bg-phase-scheduling-container text-on-phase-scheduling-container";
      case "Decision": return "border-phase-decision bg-phase-decision-container text-on-phase-decision-container";
      case "Recommendation": return "border-phase-recommendation bg-phase-recommendation-container text-on-phase-recommendation-container";
      case "Screening": return "border-phase-screening bg-phase-screening-container text-on-phase-screening-container"; // Colors for Screening phase
      default: return "border-muted bg-muted/30 text-muted-foreground";
    }
  };

  // Basic check for incomplete configuration
  const isConfigIncomplete = Object.keys(phase.config || {}).length === 0;

  const handleSaveAndCollapse = () => {
    onPhaseUpdated(); // Trigger parent refresh
    setIsExpanded(false); // Collapse the card
  };

  const handleCancelAndCollapse = () => {
    setIsExpanded(false); // Collapse the card without saving
    onPhaseUpdated(); // Re-fetch to revert any unsaved changes in the UI
  };

  return (
    <Draggable draggableId={phase.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "rounded-xl shadow-md transition-all duration-200 border-l-8",
            getPhaseColorClasses(phase.type),
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary-container" : "hover:shadow-lg",
            "flex flex-col cursor-pointer"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Summary View */}
          <div className="flex items-center p-4">
            <div {...provided.dragHandleProps} className="cursor-grab p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground transition-colors">
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-shrink-0 mr-4 text-primary">
              {getPhaseIcon(phase.type)}
            </div>
            <CardHeader className="flex-grow p-0">
              <CardTitle className="text-title-medium text-foreground flex items-center gap-2">
                {phase.name}
                <span className="text-body-small text-muted-foreground font-normal">({phase.type})</span>
                {isConfigIncomplete && (
                  <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Info className="h-3 w-3 mr-1" /> Config Incomplete
                  </Badge>
                )}
              </CardTitle>
              {phase.description && (
                <CardDescription className="text-body-small text-muted-foreground">
                  {phase.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-shrink-0 flex items-center space-x-2 p-0 pl-4">
              {canModify && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="rounded-md" onClick={(e) => e.stopPropagation()}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Phase</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-headline-small">Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription className="text-body-medium text-muted-foreground">
                        Are you sure you want to soft-delete the phase &quot;{phase.name}&quot;? It can be restored later by an admin.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(phase.id)}
                        className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Soft-Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </div>

          {/* Expanded Configuration View */}
          <div
            className={cn(
              "overflow-hidden transition-max-height duration-300 ease-in-out",
              isExpanded ? "max-h-screen-content p-4 pt-0" : "max-h-0"
            )}
          >
            {isExpanded && ( // Only render content when expanded to avoid unnecessary component lifecycle
              <div className="space-y-6 p-4 border border-border rounded-lg bg-background shadow-inner">
                {/* Phase Details Form */}
                <PhaseDetailsForm
                  pathwayTemplateId={phase.pathway_template_id}
                  initialData={phase}
                  onPhaseSaved={handleSaveAndCollapse}
                  onCancel={handleCancelAndCollapse}
                  nextOrderIndex={phase.order_index} // Not relevant for editing, but required prop
                  canModify={canModify}
                />

                {/* Phase Type-Specific Configuration */}
                <PhaseConfigurationPanel
                  phase={phase}
                  parentId={phase.pathway_template_id}
                  onConfigSaved={handleSaveAndCollapse}
                  canModify={canModify}
                />

                {/* Phase Task Management */}
                <PhaseTaskManagementPanel
                  phaseId={phase.id}
                  pathwayTemplateId={phase.pathway_template_id}
                  canModify={canModify}
                />

                {/* Branching Configuration (Conditional) */}
                {isConditional && (
                  <BranchingConfigForm
                    pathwayTemplateId={phase.pathway_template_id}
                    phase={phase}
                    onConfigSaved={handleSaveAndCollapse}
                    canModify={canModify}
                  />
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </Draggable>
  );
}