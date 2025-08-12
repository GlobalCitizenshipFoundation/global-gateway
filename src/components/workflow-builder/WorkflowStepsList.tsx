import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowStep } from "@/types";
import { WorkflowStepItem } from "./WorkflowStepItem";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface WorkflowStepsListProps {
  workflowSteps: WorkflowStep[];
  loading: boolean;
  handleDeleteStep: (stepId: string) => Promise<void>;
  onUpdateName: (stepId: string, newName: string) => void;
  onSelectStep: (step: WorkflowStep) => void;
}

export const WorkflowStepsList = ({
  workflowSteps,
  loading,
  handleDeleteStep,
  onUpdateName,
  onSelectStep,
}: WorkflowStepsListProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Workflow Steps</h3>
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : workflowSteps.length > 0 ? (
        <SortableContext items={workflowSteps.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2 p-2 min-h-[50px] border rounded-md">
            {workflowSteps.map(step => (
              <WorkflowStepItem
                key={step.id}
                step={step}
                onDelete={handleDeleteStep}
                onUpdateName={onUpdateName}
                onSelectStep={onSelectStep}
              />
            ))}
          </ul>
        </SortableContext>
      ) : (
        <p className="text-muted-foreground text-sm">No steps defined yet. Add one to get started.</p>
      )}
    </div>
  );
};