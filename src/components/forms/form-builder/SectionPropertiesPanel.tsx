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
import { FormSection } from "@/types";
import RichTextEditor from "@/components/common/RichTextEditor";
import { X } from "lucide-react";

const editFormSectionSchema = z.object({
  name: z.string().min(1, { message: "Section name cannot be empty." }),
  description: z.string().nullable().optional(),
  tooltip: z.string().nullable().optional(),
});

type EditFormSectionValues = z.infer<typeof editFormSectionSchema>;

interface SectionPropertiesPanelProps {
  section: FormSection;
  onSave: (sectionId: string, values: { name: string; description?: string | null; tooltip?: string | null; }) => Promise<void>;
  onClose: () => void;
}

export const SectionPropertiesPanel = ({
  section,
  onSave,
  onClose,
}: SectionPropertiesPanelProps) => {
  const form = useForm<EditFormSectionValues>({
    resolver: zodResolver(editFormSectionSchema),
    defaultValues: {
      name: "",
      description: "",
      tooltip: "",
    },
  });

  useEffect(() => {
    if (section) {
      form.reset({
        name: section.name,
        description: section.description || '',
        tooltip: section.tooltip || '',
      });
    }
  }, [section, form]);

  const onSubmit = (values: EditFormSectionValues) => {
    onSave(section.id, values);
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
    </div>
  );
};