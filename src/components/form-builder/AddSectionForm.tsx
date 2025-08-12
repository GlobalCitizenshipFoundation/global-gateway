import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface AddSectionFormProps {
  newSectionName: string;
  setNewSectionName: (name: string) => void;
  isSubmitting: boolean;
  handleAddSection: (e: React.FormEvent) => void;
}

export const AddSectionForm = ({
  newSectionName,
  setNewSectionName,
  isSubmitting,
  handleAddSection,
}: AddSectionFormProps) => {
  return (
    <form onSubmit={handleAddSection} className="mt-8 pt-8 border-t">
      <h3 className="text-lg font-medium">Add New Section</h3>
      <div className="flex gap-2 mt-4">
        <Input
          placeholder="e.g., 'Personal Information'"
          value={newSectionName}
          onChange={e => setNewSectionName(e.target.value)}
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting || !newSectionName.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>
    </form>
  );
};