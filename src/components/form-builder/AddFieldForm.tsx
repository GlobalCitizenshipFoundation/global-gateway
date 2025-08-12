import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormSection } from "@/types";
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AddFieldFormProps {
  newFieldLabel: string;
  setNewFieldLabel: (label: string) => void;
  newFieldType: FormField['field_type'];
  setNewFieldType: (type: FormField['field_type']) => void;
  newFieldOptions: string;
  setNewFieldOptions: (options: string) => void;
  newFieldSectionId: string | null;
  setNewFieldSectionId: (sectionId: string | null) => void;
  newFieldHelpText: string;
  setNewFieldHelpText: (text: string) => void;
  newFieldDescription: string; // New
  setNewFieldDescription: (text: string) => void; // New
  newFieldTooltip: string; // New
  setNewFieldTooltip: (text: string) => void; // New
  isSubmitting: boolean;
  handleAddField: (e: React.FormEvent) => void;
  sections: FormSection[];
}

export const AddFieldForm = ({
  newFieldLabel,
  setNewFieldLabel,
  newFieldType,
  setNewFieldType,
  newFieldOptions,
  setNewFieldOptions,
  newFieldSectionId,
  setNewFieldSectionId,
  newFieldHelpText,
  setNewFieldHelpText,
  newFieldDescription, // New
  setNewFieldDescription, // New
  newFieldTooltip, // New
  setNewFieldTooltip, // New
  isSubmitting,
  handleAddField,
  sections,
}: AddFieldFormProps) => {
  return (
    <form onSubmit={handleAddField} className="mt-8 pt-8 border-t">
      <h3 className="text-lg font-medium">Add New Field</h3>
      <div className="grid gap-2 mt-4">
        <Input
          placeholder="e.g., 'Your Personal Statement'"
          value={newFieldLabel}
          onChange={e => setNewFieldLabel(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={newFieldType} onValueChange={(value) => setNewFieldType(value as FormField['field_type'])}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Field type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="textarea">Textarea</SelectItem>
              <SelectItem value="select">Dropdown</SelectItem>
              <SelectItem value="radio">Radio Group</SelectItem>
              <SelectItem value="checkbox">Checkboxes</SelectItem>
              <SelectItem value="email">Email Address</SelectItem>
              <SelectItem value="date">Date Picker</SelectItem>
              <SelectItem value="phone">Phone Number</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="richtext">Rich Text</SelectItem>
            </SelectContent>
          </Select>
          {(newFieldType === 'select' || newFieldType === 'radio' || newFieldType === 'checkbox') && (
            <Input
              placeholder="Comma-separated options, e.g., Yes, No"
              value={newFieldOptions}
              onChange={e => setNewFieldOptions(e.target.value)}
              disabled={isSubmitting}
              className="flex-grow"
            />
          )}
        </div>
        <div>
          <Label htmlFor="new-field-description" className="sr-only">Description</Label>
          <Textarea
            id="new-field-description"
            placeholder="Optional: Add a description for this field (e.g., 'This section asks about your academic background.')"
            value={newFieldDescription}
            onChange={e => setNewFieldDescription(e.target.value)}
            disabled={isSubmitting}
            className="resize-y min-h-[60px]"
          />
        </div>
        <div>
          <Label htmlFor="new-field-help-text" className="sr-only">Help Text</Label>
          <Textarea
            id="new-field-help-text"
            placeholder="Optional: Add help text for this field (e.g., 'Max 500 words')"
            value={newFieldHelpText}
            onChange={e => setNewFieldHelpText(e.target.value)}
            disabled={isSubmitting}
            className="resize-y min-h-[60px]"
          />
        </div>
        <div>
          <Label htmlFor="new-field-tooltip" className="sr-only">Tooltip</Label>
          <Input
            id="new-field-tooltip"
            placeholder="Optional: Add a tooltip for this field (e.g., 'What is a tooltip?')"
            value={newFieldTooltip}
            onChange={e => setNewFieldTooltip(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <Select
          value={newFieldSectionId || 'none'}
          onValueChange={(value) => setNewFieldSectionId(value === 'none' ? null : value)}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Assign to Section (Optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Uncategorized</SelectItem>
            {sections.map(section => (
              <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={isSubmitting || !newFieldLabel.trim()} className="w-full sm:w-auto self-end">
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>
    </form>
  );
};