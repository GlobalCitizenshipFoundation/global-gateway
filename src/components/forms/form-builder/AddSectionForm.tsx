import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/common/RichTextEditor";

interface AddSectionFormProps {
  newSectionName: string;
  setNewSectionName: (name: string) => void;
  newSectionDescription: string;
  setNewSectionDescription: (description: string) => void;
  newSectionTooltip: string;
  setNewSectionTooltip: (tooltip: string) => void;
  isSubmitting: boolean;
  handleAddSection: (e: React.FormEvent) => void;
}

export const AddSectionForm = ({
  newSectionName,
  setNewSectionName,
  newSectionDescription,
  setNewSectionDescription,
  newSectionTooltip,
  setNewSectionTooltip,
  isSubmitting,
  handleAddSection,
}: AddSectionFormProps) => {
  return (
    <form onSubmit={handleAddSection} className="mt-8 pt-8 border-t">
      <h3 className="text-lg font-medium">Add New Section</h3>
      <div className="grid gap-2 mt-4">
        <Input
          placeholder="e.g., 'Personal Information'"
          value={newSectionName}
          onChange={e => setNewSectionName(e.target.value)}
          disabled={isSubmitting}
        />
        <div>
          <Label htmlFor="new-section-description">Section Description (Optional)</Label>
          <RichTextEditor
            value={newSectionDescription}
            onChange={setNewSectionDescription}
            readOnly={isSubmitting}
            className="min-h-[60px]"
            placeholder="Optional: Add a description for this section (e.g., 'This section asks about your academic background.')"
          />
        </div>
        <div>
          <Label htmlFor="new-section-tooltip">Tooltip Text (Optional)</Label>
          <Input
            id="new-section-tooltip"
            placeholder="e.g., 'What is a section tooltip?'"
            value={newSectionTooltip}
            onChange={e => setNewSectionTooltip(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <Button type="submit" disabled={isSubmitting || !newSectionName.trim()} className="w-full sm:w-auto self-end">
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>
    </form>
  );
};