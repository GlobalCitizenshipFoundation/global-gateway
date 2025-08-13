import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

// Import new modular components and hooks
import { useWorkflowBuilderState } from "@/hooks/useWorkflowBuilderState";
import { useWorkflowBuilderHandlers } from "@/hooks/useWorkflowBuilderHandlers";
import { useWorkflowBuilderActions } from "@/hooks/useWorkflowBuilderActions";
import { useWorkflowStepDragAndDrop } from "@/hooks/useWorkflowStepDragAndDrop";

import { WorkflowTemplateDetailsCard } from "@/components/workflow-builder/WorkflowTemplateDetailsCard";
import { WorkflowActions } from "@/components/workflow-builder/WorkflowActions";
import { AddWorkflowStepForm } from "@/components/workflow-builder/AddWorkflowStepForm";
import { WorkflowStepsList } from "@/components/workflow-builder/WorkflowStepsList";
import { WorkflowStepItem } from "@/components/workflow-builder/WorkflowStepItem";
import { WorkflowStepPropertiesPanel } from "@/components/workflow-builder/WorkflowStepPropertiesPanel";
import { WorkflowStep } from "@/types";

const WorkflowBuilderPage = () => {
  const { templateId } = useParams<{ templateId: string }>();

  // Use the state hook
  const state = useWorkflowBuilderState(templateId);
  const {
    workflowSteps,
    setWorkflowSteps,
    loading,
    newStepName, setNewStepName,
    newStepDescription, setNewStepDescription,
    newStepType, setNewStepType,
    isAddingStep,
    setHasUnsavedChanges,
    fetchData,
  } = state;

  // State for the currently selected step in the properties panel
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  // Initialize actions (these are pure data operations)
  const workflowBuilderActions = useWorkflowBuilderActions({
    templateId: state.templateId,
    setWorkflowSteps: state.setWorkflowSteps,
    fetchData: state.fetchData,
  });

  // Use the handlers hook, passing state and actions
  const handlers = useWorkflowBuilderHandlers({
    state,
    performUpdateTemplateDetails: workflowBuilderActions.handleUpdateTemplateDetails,
    performUpdateTemplateStatus: workflowBuilderActions.handleUpdateTemplateStatus,
  });

  const {
    sensors: stepSensors,
    onDragStart: onStepDragStart,
    onDragEnd: onStepDragEnd,
    activeDragItem: activeStepDragItem,
  } = useWorkflowStepDragAndDrop({ workflowSteps, setWorkflowSteps, fetchData });

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "WorkflowStep") {
      onStepDragStart(event);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.active.data.current?.type === "WorkflowStep") {
      onStepDragEnd(event);
    }
    setHasUnsavedChanges(true); // Mark as unsaved after drag/drop
  };

  // Warning for unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.hasUnsavedChanges]);

  return (
    <div className="container py-12">
      <Link to="/creator/workflow-templates" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Workflow Templates
      </Link>

      <div className="max-w-4xl mx-auto mb-8">
        <WorkflowTemplateDetailsCard state={state} />
      </div>

      <DndContext sensors={stepSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] border rounded-lg">
          <ResizablePanel defaultSize={selectedStep ? 65 : 100} minSize={30}>
            <div className="p-6 h-full overflow-y-auto">
              <WorkflowStepsList
                workflowSteps={workflowSteps}
                loading={loading}
                handleDeleteStep={handlers.handleDeleteStep}
                onUpdateName={handlers.handleUpdateStepName}
                onSelectStep={setSelectedStep}
              />

              <AddWorkflowStepForm
                newStepName={newStepName}
                setNewStepName={setNewStepName}
                newStepDescription={newStepDescription}
                setNewStepDescription={setNewStepDescription}
                newStepType={newStepType}
                setNewStepType={setNewStepType}
                isSubmitting={isAddingStep}
                handleAddStep={handlers.handleAddStep}
              />
            </div>
          </ResizablePanel>
          {selectedStep && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={35} minSize={25}>
                <WorkflowStepPropertiesPanel
                  step={selectedStep}
                  onSave={handlers.handleSaveEditedStep}
                  onClose={() => setSelectedStep(null)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        <DragOverlay>
          {activeStepDragItem ? (
            <WorkflowStepItem
              step={activeStepDragItem}
              onDelete={() => {}}
              onUpdateName={() => {}}
              onSelectStep={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <WorkflowActions state={state} handlers={handlers} />
    </div>
  );
};

export default WorkflowBuilderPage;