import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DuplicateWorkflowTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newTemplateName: string;
  setNewTemplateName: (name: string) => void;
  isDuplicating: boolean;
  onConfirm: () => void;
}

export const DuplicateWorkflowTemplateDialog = ({
  isOpen,
  onClose,
  newTemplateName,
  setNewTemplateName,
  isDuplicating,
  onConfirm,
}: DuplicateWorkflowTemplateDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent key={isOpen ? 'duplicate-workflow-open' : 'duplicate-workflow-closed'} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicate Workflow Template</DialogTitle>
          <DialogDescription>
            Give your new template a name. All stages from the current template will be copied.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template-name">New Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Copy of Standard Workflow"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} disabled={!newTemplateName.trim() || isDuplicating}>
            {isDuplicating ? 'Duplicating...' : 'Duplicate Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};