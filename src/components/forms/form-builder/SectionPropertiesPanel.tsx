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
import { Separator } from "@/components/ui/separator";
import { FormField, FormSection, DisplayRule } from "@/types";
import RichTextEditor from "@/components/common/RichTextEditor";
import { X, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ConditionalLogicBuilder from '@/components/forms/ConditionalLogicBuilder';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const editFormSectionSchema = z.object({
  name: z.string().min(1, { message: "Section name cannot be empty." }),
  description: z.string().nullable().optional(),
  tooltip: z.string().nullable().optional(),
  display_rules: z.array(z.object({
    field_id: z.string().min(1, "Field is required."),
    operator: z.string().min(1, "Operator is required."),
    value: z.any().optional().nullable(),
  })).optional().nullable(),
  display_rules_logic_type: z.enum(['AND', 'OR']).optional(),
});

type EditFormSectionValues = z.infer<typeof editFormSectionSchema>;

interface SectionPropertiesPanelProps {
  section: FormSection;
  allFields: FormField[];
  onSave: (sectionId: string, values: { name: string; description?: string | null; tooltip?: string | null; }) => Promise<void>;
  onSaveLogic: (sectionId: string, rules: DisplayRule[], logicType: 'AND' | 'OR') => Promise<void>;
  onClose: () => void;
}

export const SectionPropertiesPanel = ({
  section,
  allFields,
  onSave,
  onSaveLogic,
  onClose,
}: SectionPropertiesPanelProps) => {
  const form = useForm<EditFormSectionValues>({
    resolver: zodResolver(editFormSectionSchema),
    defaultValues: {
      name: "",
      description: "",
      tooltip: "",
      display_rules: [],
      display_rules_logic_type: 'AND',
    },
  });

  useEffect(() => {
    if (section) {
      form.reset({
        name: section.name,
        description: section.description || '',
        tooltip: section.tooltip || '',
        display_rules: section.display_rules || [],
        display_rules_logic_type: section.display_rules_logic_type || 'AND',
      });
    }
  }, [section, form]);

  const onSubmit = (values: EditFormSectionValues) => {
    onSave(section.id, {
      name: values.name,
      description: values.description ?? null,
      tooltip: values.tooltip ?? null,
    });
  };

  const handleSaveConditionalLogic = (itemId: string, rules: DisplayRule[], logicType: 'AND' | 'OR') => {
    onSaveLogic(itemId, rules, logicType);
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-background border-l">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit Section: "{section.name}"</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {!form.formState.isValid && form.formState.isSubmitted && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription>
                Please correct the errors in the form before saving.
              </AlertDescription>
            </Alert>
          )}
          <FormFieldComponent
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Personal Information" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section Description (Optional)</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    className="min-h-[80px]"
                  />
                </FormControl>
                <FormDescription>
                  A brief description displayed below the section title on the application form.
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
                    placeholder="e.g., 'What is a section tooltip?'"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  A short text that appears when the user hovers over an info icon next to the section title.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Save Section Properties</Button>
        </form>
      </Form>

      <Separator className="my-8" />

      <h3 className="text-lg font-semibold mb-4">Conditional Logic</h3>
      <ConditionalLogicBuilder
        itemToEdit={section}
        allFields={allFields}
        onSave={handleSaveConditionalLogic}
        isOpen={true}
        onClose={() => {}}
      />
    </div>
  );
};