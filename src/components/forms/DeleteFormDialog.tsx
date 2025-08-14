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
import { Form as FormType } from "@/types";

interface DeleteFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formToDelete: FormType | null;
  onConfirmDelete: () => void;
}

export const DeleteFormDialog = ({ isOpen, onClose, formToDelete, onConfirmDelete }: DeleteFormDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent key={isOpen ? 'delete-form-open' : 'delete-form-closed'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the form
            <span className="font-semibold"> "{formToDelete?.name}" </span>
            and all of its associated sections and fields. If this form is linked to a program, that program will no longer have an application form.
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