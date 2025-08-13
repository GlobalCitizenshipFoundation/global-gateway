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
import { WorkflowStep, Form as FormType, EmailTemplate } from "@/types";
import { X } from "lucide-react";

const editWorkflowStepSchema = z.object({
  name: z.string().min(1, { message: "Step name cannot be empty." }),
  description: z.string().nullable().optional(),
  step_type: z.enum(['form', 'review', 'email', 'decision']),
  form_id: z.string().nullable().optional(),
  email_template_id: z.string().nullable().optional(),
});

type EditWorkflowStepValues = z.infer<typeof editWorkflowStepSchema>;

interface WorkflowStepPropertiesPanelProps {
  step: WorkflowStep;
  forms: FormType[];
  emailTemplates: EmailTemplate[];
  onSave: (stepId: string, values: EditWorkflowStepValues) => void;
  onClose: () => void;
}

export const WorkflowStepPropertiesPanel = ({
  step,
  forms,
  emailTemplates,
  onSave,
  onClose,
}: WorkflowStepPropertiesPanelProps) => {
  const form = useForm<EditWorkflowStepValues>({
    resolver: zodResolver(editWorkflowStepSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (step) {
      form.reset({
        name: step.name,
        description: step.description || '',
        step_type: step.step_type,
        form_id: step.form_id || null,
        email_template_id: step.email_template_id || null,
      });
    }
  }, [step, form]);

  const onSubmit = (values: EditWorkflowStepValues) => {
    onSave(step.id, values);
  };

  const selectedStepType = form.watch("step_type");

  return (
    <div className="p-6 h-full overflow-y-auto bg-background border-l">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit Step</h2>
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
                <FormLabel>Step Name</FormLabel>
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
                  <Textarea placeholder="Describe the purpose of this step" {...field} value={field.value || ''} />
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
                <FormLabel>Step Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a step type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="form">Form</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="email">Send Email</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedStepType === 'form' && (
            <FormFieldComponent
              control={form.control}
              name="form_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Form</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a form for this step" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {forms.map(form => (
                        <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This form will be assigned to applicants when they reach this step.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedStepType === 'email' && (
            <FormFieldComponent
              control={form.control}
              name="email_template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Email Template</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an email template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {emailTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This email will be sent when an applicant reaches this step.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button type="submit" className="w-full mt-4">Save Step</Button>
        </form>
      </Form>
    </div>
  );
};