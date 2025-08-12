import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WorkflowTemplate } from "@/types";

interface DeleteWorkflowTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workflowTemplateToDelete: WorkflowTemplate | null;
  onConfirmDelete: () => void;
}

export const DeleteWorkflowTemplateDialog = ({ isOpen, onClose, workflowTemplateToDelete, onConfirmDelete }: DeleteWorkflowTemplateDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the workflow template
            <span className="font-semibold"> "{workflowTemplateToDelete?.name}" </span>
            and all of its associated steps. Programs linked to this template will no longer have a workflow.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};