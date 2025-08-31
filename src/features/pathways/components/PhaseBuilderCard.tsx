"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Settings, GitFork, FileText, Award, Mail, Calendar, MailCheck, Info, ExternalLink, ListChecks, ChevronDown, ChevronUp, CalendarDays } from "lucide-react"; // Added CalendarDays icon
import { Phase } from "@/types/supabase"; // Import from types/supabase
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PhaseDetailsForm } from "./PhaseDetailsForm";
import { PhaseConfigurationPanel } from "./PhaseConfigurationPanel";
import { PhaseTaskManagementPanel } from "./PhaseTaskManagementPanel";
import { BranchingConfigForm } from "./BranchingConfigForm";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns"; // Import format

interface PhaseBuilderCardProps {
  phase: Phase;
  index: number;
  onDelete: (phaseId: string) => void;
  onPhaseUpdated: () => void; // Callback for when any internal form saves
  canModify: boolean;
  isExpanded: boolean; // New prop to control expansion
  onToggleExpand: (phaseId: string) => void; // New prop to toggle expansion
}

export function PhaseBuilderCard({ phase, index, onDelete, onPhaseUpdated, canModify, isExpanded, onToggleExpand }: PhaseBuilderCardProps) {
  // Determine icon based on phase type
  const getPhaseIcon = (type: string) => {
    switch (type) {
      case "Form": return <FileText className="h-5 w-5" />;
      case "Review": return <Award className="h-5 w-5" />;
      case "Email": return <Mail className="h-5 w-5" />;
      case "Scheduling": return <Calendar className="h-5 w-5" />;
      case "Decision": return <GitFork className="h-5 w-5" />;
      case "Recommendation": return <MailCheck className="h-5 w-5" />;
      case "Screening": return <ListChecks className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
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
      case "Screening": return "border-phase-screening bg-phase-screening-container text-on-phase-screening-container";
      default: return "border-muted bg-muted/30 text-muted-foreground";
    }
  };

  // Basic check for incomplete configuration
  const isConfigIncomplete = Object.keys(phase.config || {}).length === 0;
  const isConditional = phase.type === "Decision" || phase.type === "Review";

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
            "flex flex-col"
          )}
        >
          {/* Always visible header part */}
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
              {(phase.phase_start_date || phase.phase_end_date) && (
                <p className="text-body-small text-muted-foreground flex items-center gap-1 mt-1">
                  <CalendarDays className="h-4 w-4" />
                  {phase.phase_start_date ? format(new Date(phase.phase_start_date), "PPP") : "N/A"} -{" "}
                  {phase.phase_end_date ? format(new Date(phase.phase_end_date), "PPP") : "N/A"}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-shrink-0 flex items-center space-x-2 p-0 pl-4">
              {canModify && (
                <>
                  <Button variant="outlined" size="icon" className="rounded-md" onClick={(e) => { e.stopPropagation(); onToggleExpand(phase.id); }}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                    <span className="sr-only">{isExpanded ? "Collapse" : "Configure Phase"}</span>
                  </Button>
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
                          Are you sure you want to permanently delete the phase &quot;{phase.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(phase.id)}
                          className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </CardContent>
          </div>

          {/* Collapsible content for configuration */}
          <div
            className={cn(
              "overflow-hidden transition-max-height duration-300 ease-in-out",
              isExpanded ? "max-h-[1200px] overflow-y-auto p-4 pt-0" : "max-h-0 p-0" // Increased max-h
            )}
          >
            {isExpanded && (
              <div className="space-y-8">
                <Separator className="my-4" />
                <PhaseDetailsForm
                  pathwayTemplateId={phase.pathway_template_id}
                  initialData={phase}
                  onPhaseSaved={onPhaseUpdated}
                  onCancel={() => onToggleExpand(phase.id)} // Collapse on cancel
                  nextOrderIndex={phase.order_index}
                  canModify={canModify}
                />

                <Separator className="my-4" />

                <PhaseConfigurationPanel
                  phase={phase}
                  parentId={phase.pathway_template_id}
                  onConfigSaved={onPhaseUpdated}
                  onCancel={() => onToggleExpand(phase.id)} // Collapse on cancel
                  canModify={canModify}
                />

                <Separator className="my-4" />

                <PhaseTaskManagementPanel
                  phaseId={phase.id}
                  pathwayTemplateId={phase.pathway_template_id}
                  canModify={canModify}
                />

                {isConditional && (
                  <>
                    <Separator className="my-4" />
                    <BranchingConfigForm
                      pathwayTemplateId={phase.pathway_template_id}
                      phase={phase}
                      onConfigSaved={onPhaseUpdated}
                      onCancel={() => onToggleExpand(phase.id)} // Collapse on cancel
                      canModify={canModify}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      )}
    </Draggable>
  );
}