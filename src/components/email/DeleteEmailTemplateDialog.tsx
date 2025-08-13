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
import { EmailTemplate } from "@/types";

interface DeleteEmailTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateToDelete: EmailTemplate | null;
  onConfirmDelete: () => void;
}

export const DeleteEmailTemplateDialog = ({ isOpen, onClose, templateToDelete, onConfirmDelete }: DeleteEmailTemplateDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the email template
            <span className="font-semibold"> "{templateToDelete?.name}" </span>
            and it will no longer be available for sending.
            {templateToDelete?.is_default && (
              <span className="font-bold text-destructive block mt-2">
                WARNING: This is a default system template. Deleting it may affect core application functionality.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmDelete} disabled={templateToDelete?.is_default}>
            {templateToDelete?.is_default ? "Cannot Delete" : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};