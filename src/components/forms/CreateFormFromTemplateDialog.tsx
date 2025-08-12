import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form as FormType } from "@/types";

interface CreateFormFromTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templates: FormType[];
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  newFormName: string;
  setNewFormName: (name: string) => void;
  isCreating: boolean;
  onCreate: () => void;
}

export const CreateFormFromTemplateDialog = ({
  isOpen,
  onClose,
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
  newFormName,
  setNewFormName,
  isCreating,
  onCreate,
}: CreateFormFromTemplateDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Form from Template</DialogTitle>
          <DialogDescription>
            Select an existing template and provide a name for your new form.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template-select">Select Template</Label>
            <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.length === 0 ? (
                  <SelectItem value="no-templates" disabled>No templates available</SelectItem>
                ) : (
                  templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-form-name">New Form Name</Label>
            <Input
              id="new-form-name"
              placeholder="e.g., My New Program Application"
              value={newFormName}
              onChange={(e) => setNewFormName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onCreate} disabled={!selectedTemplateId || !newFormName.trim() || isCreating}>
            {isCreating ? 'Creating...' : 'Create Form'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};