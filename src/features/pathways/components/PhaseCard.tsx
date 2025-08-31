"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Settings, GitFork, FileText, Award, Mail, Calendar, MailCheck, Info } from "lucide-react"; // Import all necessary icons
import { Phase } from "../services/pathway-template-service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Draggable } from "@hello-pangea/dnd"; // Using a dnd library
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge"; // Import Badge

interface PhaseCardProps {
  phase: Phase;
  index: number;
  onEdit: (phaseId: string) => void; // Changed to pass phaseId directly
  onDelete: (phaseId: string) => void;
  onConfigure: (phaseId: string) => void; // Changed to pass phaseId directly
  onConfigureBranching: (phase: Phase) => void; // Still needs full phase object for branching dialog
  canEditOrDelete: boolean;
}

export function PhaseCard({ phase, index, onEdit, onDelete, onConfigure, onConfigureBranching, canEditOrDelete }: PhaseCardProps) {
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
      default: return "border-muted bg-muted/30 text-muted-foreground";
    }
  };

  // Basic check for incomplete configuration
  const isConfigIncomplete = Object.keys(phase.config || {}).length === 0;

  return (
    <Draggable draggableId={phase.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "rounded-xl shadow-md transition-all duration-200 border-l-8", // Added border-l-8 for color-coding
            getPhaseColorClasses(phase.type),
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary-container" : "hover:shadow-lg",
            "flex items-center p-4 cursor-pointer"
          )}
          onClick={() => onEdit(phase.id)} // Clicking card now triggers onEdit
        >
          <div {...provided.dragHandleProps} className="cursor-grab p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-shrink-0 mr-4 text-primary"> {/* Prominent Icon */}
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
            {canEditOrDelete && (
              <>
                <Button variant="outlined" size="icon" className="rounded-md" onClick={(e) => { e.stopPropagation(); onConfigure(phase.id); }}>
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Configure Phase</span>
                </Button>
                {isConditional && (
                  <Button variant="outlined" size="icon" className="rounded-md" onClick={(e) => { e.stopPropagation(); onConfigureBranching(phase); }}>
                    <GitFork className="h-4 w-4" />
                    <span className="sr-only">Configure Branching</span>
                  </Button>
                )}
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
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}