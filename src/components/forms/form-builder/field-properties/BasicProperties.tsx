import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from "@/components/common/RichTextEditor";
import { FileText, FolderOpen } from "lucide-react";
import { FormField, FormSection } from "@/types";
import { UseFormReturn } from "react-hook-form";

interface BasicPropertiesProps {
  form: UseFormReturn<any>;
  sections: FormSection[];
  selectedFieldType: FormField['field_type'];
}

export const BasicProperties = ({ form, sections, selectedFieldType }: BasicPropertiesProps) => {
  const showOptions = ['select', 'radio', 'checkbox'].includes(selectedFieldType);
  const showPlaceholder = ['text', 'textarea', 'email', 'phone', 'number'].includes(selectedFieldType);

  return (
    <div className="grid gap-4">
      <FormFieldComponent
        control={form.control}
        name="label"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field Label</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Your Full Name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormFieldComponent
        control={form.control}
        name="field_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Field Type
            </FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a field type" />
                </SelectTrigger>
              </FormControl>
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
                <SelectItem value="rating">Rating Scale (NPS)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {showOptions && (
        <FormFieldComponent
          control={form.control}
          name="options"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Options (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Option 1, Option 2, Option 3" {...field} />
              </FormControl>
              <FormDescription>
                Enter options separated by commas for dropdowns, radio buttons, or checkboxes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormFieldComponent
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field Description (Optional)</FormLabel>
            <FormControl>
              <RichTextEditor
                value={field.value || ''}
                onChange={field.onChange}
                className="min-h-[80px]"
              />
            </FormControl>
            <FormDescription>
              A brief description displayed above the field on the application form.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormFieldComponent
        control={form.control}
        name="tooltip"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tooltip Text (Optional)</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., 'What is a tooltip?'"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              A short text that appears when the user hovers over an info icon next to the field.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      {showPlaceholder && (
        <FormFieldComponent
          control={form.control}
          name="placeholder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placeholder Text (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Enter your email address"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                This text will appear inside the input field when it's empty.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormFieldComponent
        control={form.control}
        name="section_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4" /> Section
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value || 'none'}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {sections.map(section => (
                  <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Move this field to a different section or keep it uncategorized.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormFieldComponent
        control={form.control}
        name="is_required"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Required Field
              </FormLabel>
              <FormDescription>
                Check this if the applicant must provide a response for this field.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};