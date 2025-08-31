"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { PhaseCard } from "./PhaseCard";
import { Phase } from "../services/pathway-template-service";
import { ArrowRight, GitFork, PlayCircle, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WorkflowCanvasProps {
  phases: Phase[];
  onReorder: (reorderedPhases: { id: string; order_index: number }[]) => void;
  onEditPhase: (phaseId: string) => void; // Changed to pass phaseId directly
  onDeletePhase: (phaseId: string) => void;
  onConfigurePhase: (phaseId: string) => void; // Changed to pass phaseId directly
  onConfigureBranching: (phase: Phase) => void;
  canModify: boolean;
}

// Helper component for rendering connectors
const Connector: React.FC<{ type: 'straight' | 'conditional-success' | 'conditional-failure' | 'start' | 'end'; label?: string; isLast?: boolean; isConditional?: boolean }> = ({ type, label, isLast, isConditional }) => {
  const baseClasses = "flex items-center justify-center text-muted-foreground";
  const iconClasses = "h-6 w-6";

  if (type === 'start') {
    return (
      <div className={cn(baseClasses, "py-2")}>
        <PlayCircle className={cn(iconClasses, "text-green-600")} />
        <span className="ml-2 text-label-large font-medium text-green-600">Start</span>
      </div>
    );
  }

  if (type === 'end') {
    return (
      <div className={cn(baseClasses, "py-2")}>
        <StopCircle className={cn(iconClasses, "text-red-600")} />
        <span className="ml-2 text-label-large font-medium text-red-600">End</span>
      </div>
    );
  }

  if (isLast && !isConditional) return null; // No connector after the last phase if not conditional

  return (
    <div className={cn(baseClasses, "relative py-2")}>
      {type === 'straight' && <ArrowRight className={iconClasses} />}
      {(type === 'conditional-success' || type === 'conditional-failure') && (
        <div className="flex flex-col items-center">
          <GitFork className={iconClasses} />
          {label && <span className="text-body-small mt-1">{label}</span>}
        </div>
      )}
    </div>
  );
};

export function WorkflowCanvas({
  phases,
  onReorder,
  onEditPhase,
  onDeletePhase,
  onConfigurePhase,
  onConfigureBranching,
  canModify,
}: WorkflowCanvasProps) {
  const [internalPhases, setInternalPhases] = useState<Phase[]>(phases);

  useEffect(() => {
    setInternalPhases(phases);
  }, [phases]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reordered = Array.from(internalPhases);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    const updatedOrder = reordered.map((phase, index) => ({
      id: phase.id,
      order_index: index,
    }));

    setInternalPhases(reordered); // Optimistic update
    onReorder(updatedOrder);
  };

  const renderPhaseNode = (phase: Phase, index: number) => {
    return (
      <div key={phase.id} className="relative">
        <PhaseCard
          phase={phase}
          index={index}
          onEdit={onEditPhase} // Pass onEditPhase directly
          onDelete={onDeletePhase}
          onConfigure={onConfigurePhase} // Pass onConfigurePhase directly
          onConfigureBranching={onConfigureBranching}
          canEditOrDelete={canModify}
        />
      </div>
    );
  };

  const renderConnector = (currentPhase: Phase, index: number) => {
    const isLastPhase = index === internalPhases.length - 1;
    const isConditional = currentPhase.type === "Decision" || currentPhase.type === "Review";

    // If it's the last phase, and it's conditional, we still need to show its branches if they exist
    if (isLastPhase && isConditional) {
      const nextSuccessPhase = internalPhases.find(p => p.id === currentPhase.config?.next_phase_id_on_success);
      const nextFailurePhase = internalPhases.find(p => p.id === currentPhase.config?.next_phase_id_on_failure);

      if (nextSuccessPhase || nextFailurePhase) {
        return (
          <div className="flex flex-col items-center py-4">
            <GitFork className="h-6 w-6 text-muted-foreground" />
            {nextSuccessPhase && (
              <div className="flex items-center text-green-600 text-body-small mt-1">
                <ArrowRight className="h-4 w-4 mr-1" /> Success: {nextSuccessPhase.name}
              </div>
            )}
            {nextFailurePhase && (
              <div className="flex items-center text-red-600 text-body-small mt-1">
                <ArrowRight className="h-4 w-4 mr-1" /> Failure: {nextFailurePhase.name}
              </div>
            )}
            <Connector type="end" /> {/* Always end the path after conditional branches */}
          </div>
        );
      }
      return <Connector type="end" />; // If last phase, not conditional, or conditional without branches, just end
    }

    // For non-last phases, check if it's conditional and has branches
    if (isConditional) {
      const nextSuccessPhase = internalPhases.find(p => p.id === currentPhase.config?.next_phase_id_on_success);
      const nextFailurePhase = internalPhases.find(p => p.id === currentPhase.config?.next_phase_id_on_failure);

      // If it has explicit branches, render them
      if (nextSuccessPhase || nextFailurePhase) {
        return (
          <div className="flex flex-col items-center py-4">
            <GitFork className="h-6 w-6 text-muted-foreground" />
            {nextSuccessPhase && (
              <div className="flex items-center text-green-600 text-body-small mt-1">
                <ArrowRight className="h-4 w-4 mr-1" /> Success: {nextSuccessPhase.name}
              </div>
            )}
            {nextFailurePhase && (
              <div className="flex items-center text-red-600 text-body-small mt-1">
                <ArrowRight className="h-4 w-4 mr-1" /> Failure: {nextFailurePhase.name}
              </div>
            )}
            {/* If the next phase in linear order is NOT one of the branches, also show a straight connector */}
            {!(nextSuccessPhase && nextSuccessPhase.order_index === index + 1) &&
             !(nextFailurePhase && nextFailurePhase.order_index === index + 1) && (
              <div className="mt-2">
                <Connector type="straight" />
              </div>
            )}
          </div>
        );
      }
    }

    // Default to a straight connector if no explicit branching or it's not a conditional phase
    return <Connector type="straight" />;
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="phases">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex flex-col items-center space-y-4 p-4 bg-muted/20 rounded-xl border border-border min-h-[200px]"
          >
            <Connector type="start" />
            {internalPhases.map((phase, index) => (
              <React.Fragment key={phase.id}>
                {renderPhaseNode(phase, index)}
                {renderConnector(phase, index)}
              </React.Fragment>
            ))}
            {internalPhases.length === 0 && <Connector type="end" />}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}