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
import { Button } from "@/components/ui/button";

interface AccountDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AccountDeletionDialog = ({ isOpen, onClose, onConfirm }: AccountDeletionDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent key={isOpen ? 'account-deletion-open' : 'account-deletion-closed'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Request Account Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to request the deletion of your account?
            This action is irreversible and will remove all your data from our system.
            Please note that this is a request, and further steps may be required to complete the deletion process.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Confirm Deletion Request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};