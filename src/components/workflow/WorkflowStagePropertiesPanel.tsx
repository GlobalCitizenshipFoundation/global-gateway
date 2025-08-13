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
import { DecisionOptionsInput } from './DecisionOptionsInput';
import RichTextEditor from '../common/RichTextEditor';

const editWorkflowStageSchema = z.object({
  name: z.string().min(1, { message: "Stage name cannot be empty." }),
  description: z.string().nullable().optional(),
  step_type: z.enum(['form', 'screening', 'review', 'resubmission', 'decision', 'email', 'scheduling', 'status']),
  form_id: z.string().nullable().optional(),
  email_template_id: z.string().nullable().optional(),
  decision_options: z.array(z.object({
    name: z.string().min(1, "Outcome name cannot be empty."),
    email_template_id: z.string().nullable().optional(),
  })).optional(),
  status_message: z.string().optional(),
  status_tag: z.string().optional(),
  status_custom_tag: z.string().optional(),
  resubmission_for_stage_order: z.number().nullable().optional(),
}).refine(data => {
  if (data.step_type === 'status' && data.status_tag === 'Custom' && !data.status_custom_tag) {
    return false;
  }
  if (data.step_type === 'resubmission' && (data.resubmission_for_stage_order === null || data.resubmission_for_stage_order === undefined)) {
    return false;
  }
  return true;
}, {
  message: "A target form stage must be selected for resubmission.",
  path: ["resubmission_for_stage_order"],
});

type EditWorkflowStageValues = z.infer<typeof editWorkflowStageSchema>;

interface WorkflowStagePropertiesPanelProps {
  stage: WorkflowStage;
  allStages: WorkflowStage[];
  forms: FormType[];
  emailTemplates: EmailTemplate[];
  onSave: (stageId: string, values: Partial<WorkflowStage>) => void;
  onClose: () => void;
}

export const WorkflowStagePropertiesPanel = ({
  stage,
  allStages,
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
      let decision_options: { name: string; email_template_id: string | null }[] | undefined = undefined;
      let status_message: string | undefined = undefined;
      let status_tag: string | undefined = undefined;
      let status_custom_tag: string | undefined = undefined;
      let resubmission_for_stage_order: number | undefined | null = undefined;
      let standard_description = stage.description || '';

      if (stage.step_type === 'decision' && stage.description) {
        try {
          const config = JSON.parse(stage.description);
          if (Array.isArray(config.outcomes)) {
            decision_options = config.outcomes.map((o: any) => ({ name: o.name || '', email_template_id: o.email_template_id || null }));
            standard_description = '';
          }
        } catch (e) { /* Not valid JSON */ }
      } else if (stage.step_type === 'status' && stage.description) {
        try {
          const config = JSON.parse(stage.description);
          status_message = config.message || '';
          status_tag = config.tag || 'Info';
          status_custom_tag = config.custom_tag || '';
        } catch (e) {
          status_message = stage.description;
          status_tag = 'Info';
        }
        standard_description = '';
      } else if (stage.step_type === 'resubmission' && stage.description) {
        try {
          const config = JSON.parse(stage.description);
          resubmission_for_stage_order = config.resubmission_for_stage_order;
          standard_description = '';
        } catch (e) { /* Not valid JSON */ }
      }

      form.reset({
        name: stage.name,
        description: standard_description,
        step_type: stage.step_type,
        form_id: stage.form_id || null,
        email_template_id: stage.email_template_id || null,
        decision_options: decision_options || [{ name: 'Accepted', email_template_id: null }, { name: 'Declined', email_template_id: null }],
        status_message: status_message || '',
        status_tag: status_tag || 'Info',
        status_custom_tag: status_custom_tag || '',
        resubmission_for_stage_order: resubmission_for_stage_order,
      });
    }
  }, [stage, form]);

  const onSubmit = (values: EditWorkflowStageValues) => {
    let descriptionPayload: string | null = values.description || null;

    if (values.step_type === 'decision') {
      const validOutcomes = values.decision_options?.filter(o => o.name.trim() !== '') || [];
      descriptionPayload = JSON.stringify({ outcomes: validOutcomes });
    } else if (values.step_type === 'status') {
      const statusConfig: { message: string; tag: string; custom_tag?: string } = {
        message: values.status_message || '',
        tag: values.status_tag || 'Info',
      };
      if (values.status_tag === 'Custom') {
        statusConfig.custom_tag = values.status_custom_tag || '';
      }
      descriptionPayload = JSON.stringify(statusConfig);
    } else if (values.step_type === 'resubmission') {
      descriptionPayload = JSON.stringify({ resubmission_for_stage_order: values.resubmission_for_stage_order });
    }

    const finalValues: Partial<WorkflowStage> = {
      name: values.name,
      step_type: values.step_type,
      form_id: values.form_id,
      email_template_id: values.email_template_id,
      description: descriptionPayload,
    };

    onSave(stage.id, finalValues);
  };

  const selectedStageType = form.watch("step_type");
  const selectedStatusTag = form.watch("status_tag");

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

          {selectedStageType === 'resubmission' && (
            <FormFieldComponent
              control={form.control}
              name="resubmission_for_stage_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Form to Resubmit</FormLabel>
                  <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : null)} value={String(field.value || '')}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a previous form stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allStages
                        .filter(s => s.step_type === 'form' && s.order_index < stage.order_index)
                        .map(formStage => (
                          <SelectItem key={formStage.id} value={String(formStage.order_index)}>
                            {formStage.name} (Stage {formStage.order_index})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The applicant will be asked to edit and resubmit the form from this stage.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedStageType === 'decision' && (
            <FormFieldComponent
              control={form.control}
              name="decision_options"
              render={() => (
                <FormItem>
                  <FormLabel>Decision Outcomes</FormLabel>
                  <FormControl>
                    <DecisionOptionsInput emailTemplates={emailTemplates} />
                  </FormControl>
                  <FormDescription>Define the possible outcomes and trigger an optional email for each.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedStageType === 'status' && (
            <>
              <FormFieldComponent
                control={form.control}
                name="status_tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Tag</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Info">Info</SelectItem>
                        <SelectItem value="Guideline">Guideline</SelectItem>
                        <SelectItem value="Update">Update</SelectItem>
                        <SelectItem value="Instruction">Instruction</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedStatusTag === 'Custom' && (
                <FormFieldComponent
                  control={form.control}
                  name="status_custom_tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Tag Text</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter custom tag" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormFieldComponent
                control={form.control}
                name="status_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Message</FormLabel>
                    <FormControl>
                      <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>This content will be displayed to the user at this stage.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {selectedStageType !== 'decision' && selectedStageType !== 'status' && selectedStageType !== 'resubmission' && (
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
          )}

          {['form', 'review'].includes(selectedStageType) && (
            <FormFieldComponent
              control={form.control}
              name="form_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Form (Optional)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a form for this stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">No form attached</SelectItem>
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
                <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an email template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">No email attached</SelectItem>
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