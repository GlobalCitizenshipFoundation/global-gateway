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
import { Separator } from "@/components/ui/separator";
import { WorkflowStep } from "@/types";
import { X, ListPlus } from "lucide-react";

const editWorkflowStepSchema = z.object({
  name: z.string().min(1, { message: "Step name cannot be empty." }),
  description: z.string().nullable().optional(),
  step_type: z.enum(['review', 'interview', 'decision', 'custom']),
});

type EditWorkflowStepValues = z.infer<typeof editWorkflowStepSchema>;

interface WorkflowStepPropertiesPanelProps {
  step: WorkflowStep;
  onSave: (stepId: string, values: EditWorkflowStepValues) => void;
  onClose: () => void;
}

export const WorkflowStepPropertiesPanel = ({
  step,
  onSave,
  onClose,
}: WorkflowStepPropertiesPanelProps) => {
  const form = useForm<EditWorkflowStepValues>({
    resolver: zodResolver(editWorkflowStepSchema),
    defaultValues: {
      name: "",
      description: "",
      step_type: "custom",
    },
  });

  useEffect(() => {
    if (step) {
      form.reset({
        name: step.name,
        description: step.description || '',
        step_type: step.step_type,
      });
    }
  }, [step, form]);

  const onSubmit = (values: EditWorkflowStepValues) => {
    onSave(step.id, values);
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-background border-l">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit Step: "{step.name}"</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldComponent
            control={form.control}
            name="name"
            render={({ field: formHookField }) => (
              <FormItem>
                <FormLabel>Step Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Initial Review" {...formHookField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="step_type"
            render={({ field: formHookField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <ListPlus className="h-4 w-4" /> Step Type
                </FormLabel>
                <Select onValueChange={formHookField.onChange} defaultValue={formHookField.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a step type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="description"
            render={({ field: formHookField }) => (
              <FormItem>
                <FormLabel>Step Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Optional: Describe what happens in this step."
                    {...formHookField}
                    value={formHookField.value || ''}
                    className="min-h-[80px] resize-y"
                  />
                </FormControl>
                <FormDescription>
                  A brief description for this workflow step.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Save Step Properties</Button>
        </form>
      </Form>
    </div>
  );
};