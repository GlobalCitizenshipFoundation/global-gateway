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

interface CreateWorkflowTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newTemplateName: string;
  setNewTemplateName: (name: string) => void;
  isCreating: boolean;
  onCreate: () => void;
}

export const CreateWorkflowTemplateDialog = ({
  isOpen,
  onClose,
  newTemplateName,
  setNewTemplateName,
  isCreating,
  onCreate,
}: CreateWorkflowTemplateDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workflow Template</DialogTitle>
          <DialogDescription>
            Provide a name for your new workflow template. You can add steps later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Standard Review Process"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onCreate} disabled={!newTemplateName.trim() || isCreating}>
            {isCreating ? 'Creating...' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};