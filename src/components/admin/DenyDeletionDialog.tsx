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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DenyDeletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  userName: string;
  notes: string;
  setNotes: (notes: string) => void;
  isProcessing: boolean;
}

export const DenyDeletionDialog = ({ isOpen, onClose, onConfirm, userName, notes, setNotes, isProcessing }: DenyDeletionDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deny Account Deletion Request?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the deletion request for <span className="font-semibold">{userName}</span> as denied. The user's account will remain active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2 py-4">
          <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
          <Textarea
            id="admin-notes"
            placeholder="Reason for denial..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isProcessing}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(notes)} disabled={isProcessing}>
            {isProcessing ? "Denying..." : "Confirm Denial"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};