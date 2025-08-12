import { Button } from "@/components/ui/button";
import { useWorkflowBuilderState } from "@/hooks/useWorkflowBuilderState";
import { useWorkflowBuilderHandlers } from "@/hooks/useWorkflowBuilderHandlers";

interface WorkflowActionsProps {
  state: ReturnType<typeof useWorkflowBuilderState>;
  handlers: ReturnType<typeof useWorkflowBuilderHandlers>;
}

export const WorkflowActions = ({ state, handlers }: WorkflowActionsProps) => {
  const {
    templateStatus,
    hasUnsavedChanges,
    isAutoSaving,
    isUpdatingStatus,
  } = state;

  const {
    handleManualSaveDraft,
    handlePublishUnpublish,
  } = handlers;

  return (
    <>
      <div className="flex justify-between items-center mt-8 pt-4 border-t">
        <Button variant="outline" onClick={handleManualSaveDraft} disabled={isAutoSaving || !hasUnsavedChanges}>
          {isAutoSaving ? "Saving Draft..." : "Save Draft"}
        </Button>
        <div className="flex gap-2">
          {templateStatus === 'draft' ? (
            <Button onClick={() => handlePublishUnpublish('published')} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Publishing Template..." : "Publish Template"}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handlePublishUnpublish('draft')} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? "Unpublishing Template..." : "Unpublish Template"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};