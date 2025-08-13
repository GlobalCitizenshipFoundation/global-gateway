import { Button } from "@/components/ui/button";
import { DuplicateWorkflowTemplateDialog } from "./DuplicateWorkflowTemplateDialog";

interface WorkflowActionsProps {
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  status: 'draft' | 'published';
  onSaveDraft: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onOpenDuplicateDialog: () => void;
  isDuplicateDialogOpen: boolean;
  onCloseDuplicateDialog: () => void;
  newTemplateName: string;
  setNewTemplateName: (name: string) => void;
  isDuplicating: boolean;
  onConfirmDuplicate: () => void;
}

export const WorkflowActions = ({
  isSubmitting,
  hasUnsavedChanges,
  status,
  onSaveDraft,
  onPublish,
  onUnpublish,
  onOpenDuplicateDialog,
  isDuplicateDialogOpen,
  onCloseDuplicateDialog,
  newTemplateName,
  setNewTemplateName,
  isDuplicating,
  onConfirmDuplicate,
}: WorkflowActionsProps) => {
  return (
    <>
      <div className="flex justify-between items-center mt-8 pt-4 border-t">
        <Button variant="outline" onClick={onSaveDraft} disabled={isSubmitting || !hasUnsavedChanges}>
          {isSubmitting ? "Saving..." : "Save Draft"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onOpenDuplicateDialog}>
            Duplicate Template
          </Button>
          {status === 'draft' ? (
            <Button onClick={onPublish} disabled={isSubmitting}>
              {isSubmitting ? "Publishing..." : "Publish"}
            </Button>
          ) : (
            <Button variant="outline" onClick={onUnpublish} disabled={isSubmitting}>
              {isSubmitting ? "Unpublishing..." : "Unpublish"}
            </Button>
          )}
        </div>
      </div>

      <DuplicateWorkflowTemplateDialog
        isOpen={isDuplicateDialogOpen}
        onClose={onCloseDuplicateDialog}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        isDuplicating={isDuplicating}
        onConfirm={onConfirmDuplicate}
      />
    </>
  );
};