import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField as FormFieldComponent, // Renamed to avoid conflict with FormField type
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField, FormSection } from "@/types";

const editFormFieldSchema = z.object({
  label: z.string().min(1, { message: "Label cannot be empty." }),
  field_type: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'email', 'date', 'phone', 'number', 'richtext']),
  options: z.string().optional(), // Comma-separated for select/radio/checkbox
  is_required: z.boolean(),
  help_text: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tooltip: z.string().nullable().optional(),
  placeholder: z.string().nullable().optional(), // New: Placeholder
  section_id: z.string().nullable().optional(),
});

type EditFormFieldValues = z.infer<typeof editFormFieldSchema>;

interface EditFormFieldDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fieldToEdit: FormField | null;
  onSave: (fieldId: string, values: EditFormFieldValues) => void;
  sections: FormSection[]; // New: Pass sections for dropdown
}

const EditFormFieldDialog = ({
  isOpen,
  onClose,
  fieldToEdit,
  onSave,
  sections,
}: EditFormFieldDialogProps) => {
  const form = useForm<EditFormFieldValues>({
    resolver: zodResolver(editFormFieldSchema),
    defaultValues: {
      label: "",
      field_type: "text",
      options: "",
      is_required: false,
      help_text: "",
      description: "",
      tooltip: "",
      placeholder: "", // New: default value
      section_id: null,
    },
  });

  useEffect(() => {
    if (fieldToEdit) {
      form.reset({
        label: fieldToEdit.label,
        field_type: fieldToEdit.field_type,
        options: Array.isArray(fieldToEdit.options) ? fieldToEdit.options.join(', ') : '',
        is_required: fieldToEdit.is_required,
        help_text: fieldToEdit.help_text || '',
        description: fieldToEdit.description || '',
        tooltip: fieldToEdit.tooltip || '',
        placeholder: fieldToEdit.placeholder || '', // New: set from existing field
        section_id: fieldToEdit.section_id || null,
      });
    }
  }, [fieldToEdit, form]);

  const onSubmit = (values: EditFormFieldValues) => {
    if (fieldToEdit) {
      onSave(fieldToEdit.id, values);
    }
  };

  const selectedFieldType = form.watch("field_type");
  const showPlaceholder = ['text', 'textarea', 'email', 'phone', 'number'].includes(selectedFieldType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]"> {/* Increased max-width and added scroll */}
        <DialogHeader>
          <DialogTitle>Edit Form Field</DialogTitle>
          <DialogDescription>
            Make changes to your form field here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
                  <FormLabel>Field Type</FormLabel>
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
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(selectedFieldType === 'select' || selectedFieldType === 'radio' || selectedFieldType === 'checkbox') && (
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'This section asks about your academic background.'"
                      className="resize-y min-h-[80px]"
                      {...field}
                      value={field.value || ''}
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
              name="help_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Help Text (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Please provide your full legal name as it appears on your ID.'"
                      className="resize-y min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    This text will appear below the field label to guide applicants.
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
                  <FormLabel>Tooltip (Optional)</FormLabel>
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
            {showPlaceholder && ( // Conditionally render placeholder
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
                  <FormLabel>Assign to Section (Optional)</FormLabel>
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
            <DialogFooter>
              <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFormFieldDialog;