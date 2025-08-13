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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkflowStage, Form as FormType, EmailTemplate } from "@/types";
import { X } from "lucide-react";

const editWorkflowStageSchema = z.object({
  name: z.string().min(1, { message: "Stage name cannot be empty." }),
  description: z.string().nullable().optional(),
  step_type: z.enum(['form', 'screening', 'review', 'resubmission', 'decision', 'email', 'scheduling', 'status']),
  form_id: z.string().nullable().optional(),
  email_template_id: z.string().nullable().optional(),
});

type EditWorkflowStageValues = z.infer<typeof editWorkflowStageSchema>;

interface WorkflowStagePropertiesPanelProps {
  stage: WorkflowStage;
  forms: FormType[];
  emailTemplates: EmailTemplate[];
  onSave: (stageId: string, values: EditWorkflowStageValues) => void;
  onClose: () => void;
}

export const WorkflowStagePropertiesPanel = ({
  stage,
  forms,
  emailTemplates,
  onSave,
  onClose,
}: WorkflowStagePropertiesPanelProps) => {
  const form = useForm<EditWorkflowStageValues>({
    resolver: zodResolver(editWorkflowStageSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (stage) {
      form.reset({
        name: stage.name,
        description: stage.description || '',
        step_type: stage.step_type,
        form_id: stage.form_id || null,
        email_template_id: stage.email_template_id || null,
      });
    }
  }, [stage, form]);

  const onSubmit = (values: EditWorkflowStageValues) => {
    onSave(stage.id, values);
  };

  const selectedStageType = form.watch("step_type");

  return (
    <div className="p-6 h-full overflow-y-auto bg-background border-l">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit Stage</h2>
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
                <FormLabel>Stage Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Initial Review" {...field} />
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
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the purpose of this stage" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="step_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stage type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="resubmission">Resubmission</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="scheduling">Scheduling</SelectItem>
                    <SelectItem value="status">Status / Message</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {['form', 'review', 'resubmission'].includes(selectedStageType) && (
            <FormFieldComponent
              control={form.control}
              name="form_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Form (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a form for this stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No form attached</SelectItem>
                      {forms.map(form => (
                        <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This form can be assigned to users when they reach this stage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormFieldComponent
            control={form.control}
            name="email_template_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trigger Email (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an email template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No email attached</SelectItem>
                    {emailTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  This email will be sent when an applicant reaches this stage.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full mt-4">Save Stage</Button>
        </form>
      </Form>
    </div>
  );
};