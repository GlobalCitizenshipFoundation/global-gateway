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
import { EvaluationTemplate } from "@/types";

interface DeleteEvaluationTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateToDelete: EvaluationTemplate | null;
  onConfirmDelete: () => void;
}

export const DeleteEvaluationTemplateDialog = ({ isOpen, onClose, templateToDelete, onConfirmDelete }: DeleteEvaluationTemplateDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the evaluation template
            <span className="font-semibold"> "{templateToDelete?.name}" </span>
            and all of its associated criteria.
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