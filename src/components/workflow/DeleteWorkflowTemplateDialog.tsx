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
  templateToDelete: WorkflowTemplate | null;
  onConfirmDelete: () => void;
}

export const DeleteWorkflowTemplateDialog = ({ isOpen, onClose, templateToDelete, onConfirmDelete }: DeleteWorkflowTemplateDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent key={isOpen ? 'delete-workflow-open' : 'delete-workflow-closed'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the workflow template
            <span className="font-semibold"> "{templateToDelete?.name}" </span>
            and all of its associated steps.
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