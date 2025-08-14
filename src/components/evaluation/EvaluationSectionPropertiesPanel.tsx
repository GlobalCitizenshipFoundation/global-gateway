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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EvaluationSection } from "@/types";
import { X, AlertTriangle } from "lucide-react"; // Import AlertTriangle
import RichTextEditor from '../common/RichTextEditor';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'; // Import Alert

const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required."),
  description: z.string().optional().nullable(),
  is_public: z.boolean(),
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
        is_public: section.is_public,
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
          {!form.formState.isValid && form.formState.isSubmitted && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription>
                Please correct the errors in the form before saving.
              </AlertDescription>
            </Alert>
          )}
          <FormFieldComponent control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Section Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormFieldComponent control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><RichTextEditor value={field.value || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
          <FormFieldComponent
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Visibility: <span className="font-bold text-primary">{field.value ? 'Public' : 'Internal'}</span>
                  </FormLabel>
                  <FormDescription>
                    Public sections and their criteria may be shared with applicants.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Save Section</Button>
        </form>
      </Form>
    </div>
  );
};