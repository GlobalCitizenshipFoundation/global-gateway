"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, GripVertical } from "lucide-react";
import { Phase } from "../services/pathway-template-service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Draggable } from "@hello-pangea/dnd"; // Using a dnd library

interface PhaseCardProps {
  phase: Phase;
  index: number;
  onEdit: (phase: Phase) => void;
  onDelete: (phaseId: string) => void;
  canEditOrDelete: boolean;
}

export function PhaseCard({ phase, index, onEdit, onDelete, canEditOrDelete }: PhaseCardProps) {
  return (
    <Draggable draggableId={phase.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`rounded-xl shadow-md transition-all duration-200 ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-primary-container" : "hover:shadow-lg"
          } flex items-center p-4`}
        >
          <div {...provided.dragHandleProps} className="cursor-grab p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground transition-colors">
            <GripVertical className="h-5 w-5" />
          </div>
          <CardHeader className="flex-grow p-0">
            <CardTitle className="text-title-medium text-foreground flex items-center gap-2">
              {phase.name}
              <span className="text-body-small text-muted-foreground font-normal">({phase.type})</span>
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
                <Button variant="outline" size="icon" className="rounded-md" onClick={() => onEdit(phase)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit Phase</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="rounded-md">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Phase</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-headline-small">Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription className="text-body-medium text-muted-foreground">
                        Are you sure you want to delete the phase &quot;{phase.name}&quot;? This action cannot be undone.
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
        </Card>
      )}
    </Draggable>
  );
}