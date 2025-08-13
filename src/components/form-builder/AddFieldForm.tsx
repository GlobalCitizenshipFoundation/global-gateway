import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormSection } from "@/types";
import { Plus, FileText, FolderOpen } from "lucide-react"; // Import FileText and FolderOpen icons
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/common/RichTextEditor"; // Updated import path

interface AddFieldFormProps {
  newFieldLabel: string;
  setNewFieldLabel: (label: string) => void;
  newFieldType: FormField['field_type'];
  setNewFieldType: (type: FormField['field_type']) => void;
  newFieldOptions: string;
  setNewFieldOptions: (options: string) => void;
  newFieldSectionId: string | null;
  setNewFieldSectionId: (sectionId: string | null) => void;
  newFieldDescription: string;
  setNewFieldDescription: (text: string) => void;
  newFieldTooltip: string;
  setNewFieldTooltip: (text: string) => void;
  newFieldPlaceholder: string;
  setNewFieldPlaceholder: (text: string) => void;
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
  newFieldDescription,
  setNewFieldDescription,
  newFieldTooltip,
  setNewFieldTooltip,
  newFieldPlaceholder,
  setNewFieldPlaceholder,
  isSubmitting,
  handleAddField,
  sections,
}: AddFieldFormProps) => {
  const showPlaceholder = ['text', 'textarea', 'email', 'phone', 'number'].includes(newFieldType);

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
          <div className="grid gap-2 w-full sm:w-[140px]">
            <Label htmlFor="new-field-type" className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Field Type
            </Label>
            <Select value={newFieldType} onValueChange={(value) => setNewFieldType(value as FormField['field_type'])}>
              <SelectTrigger id="new-field-type">
                <SelectValue placeholder="Select type" />
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
          </div>
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
          <Label htmlFor="new-field-description">Field Description (Optional)</Label>
          <RichTextEditor
            value={newFieldDescription}
            onChange={setNewFieldDescription}
            readOnly={isSubmitting}
            className="min-h-[60px]"
            placeholder="Optional: Add a description for this field (e.g., 'This section asks about your academic background.')"
          />
        </div>
        <div>
          <Label htmlFor="new-field-tooltip">Tooltip Text (Optional)</Label>
          <Input
            id="new-field-tooltip"
            placeholder="e.g., 'What is a tooltip?'"
            value={newFieldTooltip}
            onChange={e => setNewFieldTooltip(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        {showPlaceholder && (
          <div>
            <Label htmlFor="new-field-placeholder">Placeholder Text (Optional)</Label>
            <Input
              id="new-field-placeholder"
              placeholder="e.g., Enter your email address"
              value={newFieldPlaceholder}
              onChange={e => setNewFieldPlaceholder(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground mt-1">
              This text will appear inside the input field when it's empty.
            </p>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="new-field-section-id" className="flex items-center gap-1">
            <FolderOpen className="h-4 w-4" /> Section
          </Label>
          <Select
            value={newFieldSectionId || 'none'}
            onValueChange={(value) => setNewFieldSectionId(value === 'none' ? null : value)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="new-field-section-id">
              <SelectValue placeholder="Assign to Section (Optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Uncategorized</SelectItem>
              {sections.map(section => (
                <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isSubmitting || !newFieldLabel.trim()} className="w-full sm:w-auto self-end">
          <Plus className="mr-2 h-4 w-4" />
          Add Field
        </Button>
      </div>
    </form>
  );
};