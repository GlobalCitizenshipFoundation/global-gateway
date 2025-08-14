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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkflowStage, Form as FormType, EmailTemplate, EvaluationTemplate } from "@/types";
import { X } from "lucide-react";
import { GeneralProperties } from './stage-properties/GeneralProperties';
import { ReviewProperties } from './stage-properties/ReviewProperties';
import { ResubmissionProperties } from './stage-properties/ResubmissionProperties';
import { DecisionProperties } from './stage-properties/DecisionProperties';
import { StatusProperties } from './stage-properties/StatusProperties';
import { RecommendationProperties } from './stage-properties/RecommendationProperties';
import { FormAttachmentProperties } from './stage-properties/FormAttachmentProperties';

const editWorkflowStageSchema = z.object({
  name: z.string().min(1, { message: "Stage name cannot be empty." }),
  description: z.string().nullable().optional(),
  step_type: z.enum(['form', 'screening', 'review', 'resubmission', 'decision', 'email', 'scheduling', 'status', 'recommendation']),
  form_id: z.string().nullable().optional(),
  email_template_id: z.string().nullable().optional(),
  evaluation_template_id: z.string().nullable().optional(),
  anonymize_identity: z.boolean().optional(),
  decision_options: z.array(z.object({
    name: z.string().min(1, "Outcome name cannot be empty."),
    email_template_id: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
  })).optional(),
  status_message: z.string().optional(),
  status_tag: z.string().optional(),
  status_custom_tag: z.string().optional(),
  resubmission_for_stage_order: z.number().nullable().optional(),
  rec_form_id: z.string().nullable().optional(),
  rec_min_recommenders: z.preprocess((val) => (val === '' ? null : Number(val)), z.number().nullable().optional()),
  rec_max_recommenders: z.preprocess((val) => (val === '' ? null : Number(val)), z.number().nullable().optional()),
  rec_reminder_email_template_id: z.string().nullable().optional(),
  rec_reminder_intervals_days: z.string().optional(),
  rec_anonymize_recommender_identity: z.boolean().optional(),
}).refine(data => {
  if (data.step_type === 'status' && data.status_tag === 'Custom' && !data.status_custom_tag) {
    return false;
  }
  if (data.step_type === 'resubmission' && (data.resubmission_for_stage_order === null || data.resubmission_for_stage_order === undefined)) {
    return false;
  }
  if (data.step_type === 'recommendation') {
    if (!data.rec_form_id) return false;
    if (data.rec_min_recommenders === null || data.rec_min_recommenders === undefined || data.rec_min_recommenders < 0) return false;
    if (data.rec_max_recommenders === null || data.rec_max_recommenders === undefined || data.rec_max_recommenders < data.rec_min_recommenders) return false;
  }
  return true;
}, {
  message: "A target form stage must be selected for resubmission.",
  path: ["resubmission_for_stage_order"],
}).refine(data => {
  if (data.step_type === 'recommendation') {
    if (!data.rec_form_id) {
      return false;
    }
    if (data.rec_min_recommenders === null || data.rec_min_recommenders === undefined || data.rec_min_recommenders < 0) {
      return false;
    }
    if (data.rec_max_recommenders === null || data.rec_max_recommenders === undefined || data.rec_max_recommenders < data.rec_min_recommenders) {
      return false;
    }
  }
  return true;
}, {
  message: "Recommendation stage requires a form, min/max recommenders, and valid ranges.",
  path: ["rec_form_id"],
});

type EditWorkflowStageValues = z.infer<typeof editWorkflowStageSchema>;

interface WorkflowStagePropertiesPanelProps {
  stage: WorkflowStage;
  allStages: WorkflowStage[];
  forms: FormType[];
  emailTemplates: EmailTemplate[];
  evaluationTemplates: EvaluationTemplate[];
  onSave: (stageId: string, values: Partial<WorkflowStage>) => void;
  onClose: () => void;
}

export const WorkflowStagePropertiesPanel = ({
  stage,
  allStages,
  forms,
  emailTemplates,
  evaluationTemplates,
  onSave,
  onClose,
}: WorkflowStagePropertiesPanelProps) => {
  const form = useForm<EditWorkflowStageValues>({
    resolver: zodResolver(editWorkflowStageSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (stage) {
      let decision_options: { name: string; email_template_id: string | null; icon: string | null; }[] | undefined = undefined;
      let status_message: string | undefined = undefined;
      let status_tag: string | undefined = undefined;
      let status_custom_tag: string | undefined = undefined;
      let resubmission_for_stage_order: number | undefined | null = undefined;
      let anonymize_identity: boolean | undefined = undefined;
      let rec_form_id: string | undefined | null = undefined;
      let rec_min_recommenders: number | undefined | null = undefined;
      let rec_max_recommenders: number | undefined | null = undefined;
      let rec_reminder_email_template_id: string | undefined | null = undefined;
      let rec_reminder_intervals_days: string | undefined = undefined;
      let rec_anonymize_recommender_identity: boolean | undefined = undefined;
      let standard_description = stage.description || '';

      if (stage.step_type === 'decision' && stage.description) {
        try {
          const config = JSON.parse(stage.description);
          if (Array.isArray(config.outcomes)) {
            decision_options = config.outcomes.map((o: any) => ({ name: o.name || '', email_template_id: o.email_template_id || null, icon: o.icon || null }));
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
      } else if (stage.step_type === 'review' && stage.description) {
        try {
          const config = JSON.parse(stage.description);
          anonymize_identity = config.anonymize_identity || false;
          standard_description = ''; // Review stage description is for config only
        } catch (e) { /* Not valid JSON */ }
      } else if (stage.step_type === 'recommendation' && stage.description) {
        try {
          const config = JSON.parse(stage.description);
          rec_form_id = config.form_id || null;
          rec_min_recommenders = config.min_recommenders ?? null;
          rec_max_recommenders = config.max_recommenders ?? null;
          rec_reminder_email_template_id = config.reminder_email_template_id || null;
          rec_reminder_intervals_days = Array.isArray(config.reminder_intervals_days) ? config.reminder_intervals_days.join(', ') : '';
          rec_anonymize_recommender_identity = config.anonymize_recommender_identity || false;
          standard_description = '';
        } catch (e) { /* Not valid JSON */ }
      }

      form.reset({
        name: stage.name,
        description: standard_description,
        step_type: stage.step_type,
        form_id: stage.form_id || null,
        email_template_id: stage.email_template_id || null,
        evaluation_template_id: stage.evaluation_template_id || null,
        anonymize_identity: anonymize_identity || false,
        decision_options: decision_options || [
          { name: 'Accept', email_template_id: null, icon: 'CheckCircle' },
          { name: 'Decline', email_template_id: null, icon: 'XCircle' },
          { name: 'Waitlist / Hold', email_template_id: null, icon: 'Hourglass' },
          { name: 'Needs Revision', email_template_id: null, icon: 'Activity' },
          { name: 'Resubmit', email_template_id: null, icon: 'Pencil' },
          { name: 'Advance to Next Stage', email_template_id: null, icon: 'ArrowRight' },
          { name: 'Custom', email_template_id: null, icon: 'Wrench' }
        ],
        status_message: status_message || '',
        status_tag: status_tag || 'Info',
        status_custom_tag: status_custom_tag || '',
        resubmission_for_stage_order: resubmission_for_stage_order,
        rec_form_id: rec_form_id,
        rec_min_recommenders: rec_min_recommenders,
        rec_max_recommenders: rec_max_recommenders,
        rec_reminder_email_template_id: rec_reminder_email_template_id,
        rec_reminder_intervals_days: rec_reminder_intervals_days,
        rec_anonymize_recommender_identity: rec_anonymize_recommender_identity,
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
    } else if (values.step_type === 'review') {
      descriptionPayload = JSON.stringify({ anonymize_identity: values.anonymize_identity });
    } else if (values.step_type === 'recommendation') {
      const reminderIntervals = values.rec_reminder_intervals_days?.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) || [];
      descriptionPayload = JSON.stringify({
        form_id: values.rec_form_id,
        min_recommenders: values.rec_min_recommenders,
        max_recommenders: values.rec_max_recommenders,
        reminder_email_template_id: values.rec_reminder_email_template_id,
        reminder_intervals_days: reminderIntervals,
        anonymize_recommender_identity: values.rec_anonymize_recommender_identity,
      });
    }

    const finalValues: Partial<WorkflowStage> = {
      name: values.name,
      step_type: values.step_type,
      form_id: values.form_id,
      email_template_id: values.email_template_id,
      evaluation_template_id: values.evaluation_template_id,
      description: descriptionPayload,
    };

    onSave(stage.id, finalValues);
  };

  const selectedStageType = form.watch("step_type");

  const publishedEvaluationTemplates = evaluationTemplates.filter(t => t.status === 'published');
  const publishedForms = forms.filter(f => f.status === 'published');

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
            name="step_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
                    <SelectItem value="recommendation">Recommendation Request</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <GeneralProperties
            form={form}
            emailTemplates={emailTemplates}
            selectedStageType={selectedStageType}
          />

          {selectedStageType === 'review' && (
            <ReviewProperties
              form={form}
              publishedEvaluationTemplates={publishedEvaluationTemplates}
            />
          )}

          {selectedStageType === 'resubmission' && (
            <ResubmissionProperties
              form={form}
              allStages={allStages}
              currentStageId={stage.id}
            />
          )}

          {selectedStageType === 'decision' && (
            <DecisionProperties
              form={form}
              emailTemplates={emailTemplates}
            />
          )}

          {selectedStageType === 'status' && (
            <StatusProperties
              form={form}
            />
          )}

          {selectedStageType === 'recommendation' && (
            <RecommendationProperties
              form={form}
              publishedForms={publishedForms}
              emailTemplates={emailTemplates}
            />
          )}

          {['form', 'review'].includes(selectedStageType) && (
            <FormAttachmentProperties
              form={form}
              forms={forms}
            />
          )}

          <Button type="submit" className="w-full mt-4">Save Stage</Button>
        </form>
      </Form>
    </div>
  );
};