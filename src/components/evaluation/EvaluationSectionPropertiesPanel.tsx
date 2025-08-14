import { useEffect } from 'react';
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EvaluationSection } from "@/types";
import { X } from "lucide-react";

const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required."),
  description: z.string().optional().nullable(),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

interface EvaluationSectionPropertiesPanelProps {
  section: EvaluationSection;
  onSave: (sectionId: string, values: Partial<EvaluationSection>) => Promise<void>;
  onClose: () => void;
}

export const EvaluationSectionPropertiesPanel = ({ section, onSave, onClose }: EvaluationSectionPropertiesPanelProps) => {
  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (section) {
      form.reset({
        name: section.name,
        description: section.description,
      });
    }
  }, [section, form]);

  const onSubmit = (values: SectionFormValues) => {
    onSave(section.id, values);
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-background border-l">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit Section</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormFieldComponent control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Section Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormFieldComponent control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
          <Button type="submit" className="w-full">Save Section</Button>
        </form>
      </Form>
    </div>
  );
};