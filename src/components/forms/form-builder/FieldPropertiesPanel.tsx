import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FormField, FormSection, DisplayRule } from "@/types";
import ConditionalLogicBuilder from "@/components/forms/ConditionalLogicBuilder";
import RichTextEditor from "@/components/common/RichTextEditor";
import { X, FileText, FolderOpen, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const editFormFieldSchema = z.object({
  label: z.string().min(1, { message: "Label cannot be empty." }),
  field_type: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'email', 'date', 'phone', 'number', 'richtext', 'rating']),
  options: z.string().optional(),
  is_required: z.boolean(),
  description: z.string().nullable().optional(),
  tooltip: z.string().nullable().optional(),
  placeholder: z.string().nullable().optional(),
  section_id: z.string().nullable().optional(),
  date_min: z.string().nullable().optional(),
  date_max: z.string().nullable().optional(),
  date_allow_past: z.boolean().optional(),
  date_allow_future: z.boolean().optional(),
  rating_min_value: z.preprocess((val) => (val === '' ? null : Number(val)), z.number().nullable().optional()),
  rating_max_value: z.preprocess((val) => (val === '' ? null : Number(val)), z.number().nullable().optional()),
  rating_min_label: z.string().nullable().optional(),
  rating_max_label: z.string().nullable().optional(),
});

type EditFormFieldValues = z.infer<typeof editFormFieldSchema>;

interface FieldPropertiesPanelProps {
  field: FormField;
  sections: FormSection[];
  allFields: FormField[];
  onSave: (fieldId: string, values: EditFormFieldValues) => void;
  onSaveLogic: (fieldId: string, rules: DisplayRule[], logicType: 'AND' | 'OR') => void;
  onClose: () => void;
}

export const FieldPropertiesPanel = ({
  field,
  sections,
  allFields,
  onSave,
  onSaveLogic,
  onClose,
}: FieldPropertiesPanelProps) => {
  const form = useForm<EditFormFieldValues>({
    resolver: zodResolver(editFormFieldSchema),
    defaultValues: {
      label: "",
      field_type: "text",
      options: "",
      is_required: false,
      description: "",
      tooltip: "",
      placeholder: "",
      section_id: null,
      date_min: null,
      date_max: null,
      date_allow_past: true,
      date_allow_future: true,
      rating_min_value: 1,
      rating_max_value: 5,
      rating_min_label: "Poor",
      rating_max_label: "Excellent",
    },
  });

  useEffect(() => {
    if (field) {
      form.reset({
        label: field.label,
        field_type: field.field_type as EditFormFieldValues['field_type'],
        options: Array.isArray(field.options) ? field.options.join(', ') : '',
        is_required: field.is_required,
        description: field.description || '',
        tooltip: field.tooltip || '',
        placeholder: field.placeholder || '',
        section_id: field.section_id || null,
        date_min: field.date_min || null,
        date_max: field.date_max || null,
        date_allow_past: field.date_allow_past ?? true,
        date_allow_future: field.date_allow_future ?? true,
        rating_min_value: field.rating_min_value ?? 1,
        rating_max_value: field.rating_max_value ?? 5,
        rating_min_label: field.rating_min_label || "Poor",
        rating_max_label: field.rating_max_label || "Excellent",
      });
    }
  }, [field, form]);

  const onSubmit = (values: EditFormFieldValues) => {
    onSave(field.id, values);
  };

  const selectedFieldType = form.watch("field_type");
  const showPlaceholder = ['text', 'textarea', 'email', 'phone', 'number'].includes(selectedFieldType);
  const showDateSettings = selectedFieldType === 'date';
  const showRatingSettings = selectedFieldType === 'rating';

  return (
    <div className="p-6 h-full overflow-y-auto bg-background border-l">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit Field: "{field.label}"</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldComponent
            control={form.control}
            name="label"
            render={({ field: formHookField }) => (
              <FormItem>
                <FormLabel>Field Label</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Your Full Name" {...formHookField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="field_type"
            render={({ field: formHookField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <FileText className="h-4 w-4" /> Field Type
                </FormLabel>
                <Select onValueChange={formHookField.onChange} defaultValue={formHookField.value}>
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
          {(selectedFieldType === 'select' || selectedFieldType === 'radio' || selectedFieldType === 'checkbox') && (
            <FormFieldComponent
              control={form.control}
              name="options"
              render={({ field: formHookField }) => (
                <FormItem>
                  <FormLabel>Options (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Option 1, Option 2, Option 3" {...formHookField} />
                  </FormControl>
                  <FormDescription>
                    Enter options separated by commas for dropdowns, radio buttons, or checkboxes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {showDateSettings && (
            <>
              <h3 className="text-md font-semibold mt-4">Date Picker Settings</h3>
              <FormFieldComponent
                control={form.control}
                name="date_min"
                render={({ field: formHookField }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Minimum Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !formHookField.value && "text-muted-foreground"
                            )}
                          >
                            {formHookField.value ? (
                              format(new Date(formHookField.value), "PPP")
                            ) : (
                              <span>No minimum date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formHookField.value ? new Date(formHookField.value) : undefined}
                          onSelect={(date) => formHookField.onChange(date ? date.toISOString() : null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Set the earliest date an applicant can select.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormFieldComponent
                control={form.control}
                name="date_max"
                render={({ field: formHookField }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Maximum Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !formHookField.value && "text-muted-foreground"
                            )}
                          >
                            {formHookField.value ? (
                              format(new Date(formHookField.value), "PPP")
                            ) : (
                              <span>No maximum date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formHookField.value ? new Date(formHookField.value) : undefined}
                          onSelect={(date) => formHookField.onChange(date ? date.toISOString() : null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Set the latest date an applicant can select.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormFieldComponent
                control={form.control}
                name="date_allow_past"
                render={({ field: formHookField }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={formHookField.value}
                        onCheckedChange={formHookField.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Allow Past Dates
                      </FormLabel>
                      <FormDescription>
                        If unchecked, applicants cannot select dates before today.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormFieldComponent
                control={form.control}
                name="date_allow_future"
                render={({ field: formHookField }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={formHookField.value}
                        onCheckedChange={formHookField.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Allow Future Dates
                      </FormLabel>
                      <FormDescription>
                        If unchecked, applicants cannot select dates after today.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </>
          )}
          {showRatingSettings && (
            <>
              <h3 className="text-md font-semibold mt-4">Rating Scale Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormFieldComponent
                  control={form.control}
                  name="rating_min_value"
                  render={({ field: formHookField }) => (
                    <FormItem>
                      <FormLabel>Minimum Value</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...formHookField} value={formHookField.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormFieldComponent
                  control={form.control}
                  name="rating_max_value"
                  render={({ field: formHookField }) => (
                    <FormItem>
                      <FormLabel>Maximum Value</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 10" {...formHookField} value={formHookField.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormFieldComponent
                  control={form.control}
                  name="rating_min_label"
                  render={({ field: formHookField }) => (
                    <FormItem>
                      <FormLabel>Min Value Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Not at all likely" {...formHookField} value={formHookField.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormFieldComponent
                  control={form.control}
                  name="rating_max_label"
                  render={({ field: formHookField }) => (
                    <FormItem>
                      <FormLabel>Max Value Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Extremely likely" {...formHookField} value={formHookField.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                Define the range and labels for your rating scale.
              </FormDescription>
            </>
          )}
          <FormFieldComponent
            control={form.control}
            name="description"
            render={({ field: formHookField }) => (
              <FormItem>
                <FormLabel>Field Description (Optional)</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={formHookField.value || ''}
                    onChange={formHookField.onChange}
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
            render={({ field: formHookField }) => (
              <FormItem>
                <FormLabel>Tooltip Text (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 'What is a tooltip?'"
                    {...formHookField}
                    value={formHookField.value || ''}
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
              render={({ field: formHookField }) => (
                <FormItem>
                  <FormLabel>Placeholder Text (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Enter your email address"
                      {...formHookField}
                      value={formHookField.value || ''}
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
            render={({ field: formHookField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <FolderOpen className="h-4 w-4" /> Section
                </FormLabel>
                <Select onValueChange={formHookField.onChange} value={formHookField.value || 'none'}>
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
            render={({ field: formHookField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={formHookField.value}
                    onCheckedChange={formHookField.onChange}
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
          <Button type="submit" className="w-full">Save Field Properties</Button>
        </form>
      </Form>

      <Separator className="my-8" />

      <h3 className="text-lg font-semibold mb-4">Conditional Logic</h3>
      <ConditionalLogicBuilder
        fieldToEdit={field}
        allFields={allFields}
        onSave={onSaveLogic}
        isOpen={true}
        onClose={() => {}}
      />
    </div>
  );
};