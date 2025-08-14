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
import { Form as FormType } from "@/types";

interface SaveAsTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formToCopy: FormType | null;
  newTemplateName: string;
  setNewTemplateName: (name: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

export const SaveAsTemplateDialog = ({
  isOpen,
  onClose,
  formToCopy,
  newTemplateName,
  setNewTemplateName,
  isSaving,
  onSave,
}: SaveAsTemplateDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Form as Template</DialogTitle>
          <DialogDescription>
            Give your new template a name. All sections and fields from this form will be copied.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Standard Application Template"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={!newTemplateName.trim() || isSaving}>
            {isSaving ? 'Saving...' : 'Save as Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};