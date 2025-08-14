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
import { X, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GeneralProperties } from './stage-properties/GeneralProperties';
import { ReviewProperties } from './stage-properties/ReviewProperties';
import { ResubmissionProperties } from './stage-properties/ResubmissionProperties';
import { DecisionProperties } from './stage-properties/DecisionProperties';
import { StatusProperties } from './stage-properties/StatusProperties';
import { RecommendationProperties } from './stage-properties/RecommendationProperties';
import { FormAttachmentProperties } from './stage-properties/FormAttachmentProperties';

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
  const editWorkflowStageSchema = z.object({
    name: z.string().min(1, { message: "Stage name cannot be empty." }),
    description: z.string().nullable().optional(),
    step_type: z.enum(['form', 'screening', 'review', 'resubmission', 'decision', 'email', 'scheduling', 'status', 'recommendation']),
    form_id: z.string().nullable().optional(),
    email_template_id: z.string().nullable().optional(),
    evaluation_template_id: z.string().nullable().optional(),
    anonymize_identity: z.boolean().optional(),
    review_form_source_stage_order: z.number().nullable().optional(),
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
  }).superRefine((data, ctx) => {
    // Validation for 'form' type
    if (data.step_type === 'form' && !data.form_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A form must be selected for this stage.",
        path: ['form_id'],
      });
    }

    // Validation for 'email' type
    if (data.step_type === 'email' && !data.email_template_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "An email template must be selected for this stage.",
        path: ['email_template_id'],
      });
    }

    // Validation for 'status' type
    if (data.step_type === 'status') {
      if (data.status_tag === 'Custom' && (!data.status_custom_tag || data.status_custom_tag.trim() === '')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom tag text is required when 'Custom' is selected.",
          path: ['status_custom_tag'],
        });
      }
      if (!data.status_message || data.status_message.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Status message cannot be empty.",
          path: ['status_message'],
        });
      }
    }

    // Validation for 'resubmission' type
    if (data.step_type === 'resubmission' && (data.resubmission_for_stage_order === null || data.resubmission_for_stage_order === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A target form stage must be selected for resubmission.",
        path: ['resubmission_for_stage_order'],
      });
    }

    // Validation for 'review' type
    if (data.step_type === 'review') {
      if (data.evaluation_template_id === null || data.evaluation_template_id === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "An evaluation rubric must be selected for this stage.",
          path: ['evaluation_template_id'],
        });
      }

      // Directly use the form field value for review_form_source_stage_order
      if (data.review_form_source_stage_order === null || data.review_form_source_stage_order === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A form to review must be selected.',
          path: ['review_form_source_stage_order'],
        });
      } else {
        const sourceStage = allStages.find((s: WorkflowStage) => s.order_index === data.review_form_source_stage_order);
        if (!sourceStage) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The selected form to review (Stage ${data.review_form_source_stage_order}) does not exist.`,
            path: ['review_form_source_stage_order'],
          });
        } else if (sourceStage.step_type !== 'form') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The selected form to review ('${sourceStage.name}') is not a 'Form' stage.`,
            path: ['review_form_source_stage_order'],
          });
        }
      }
    }

    // Validation for 'decision' type
    if (data.step_type === 'decision') {
      if (!data.decision_options || data.decision_options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one decision outcome must be defined.",
          path: ['decision_options'],
        });
      } else {
        data.decision_options.forEach((outcome, index) => {
          if (!outcome.name || outcome.name.trim() === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Outcome name cannot be empty.",
              path: ['decision_options', index, 'name'],
            });
          }
        });
      }
    }

    // Validation for 'recommendation' type
    if (data.step_type === 'recommendation') {
      if (!data.rec_form_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A recommendation form must be selected.",
          path: ['rec_form_id'],
        });
      }
      if (data.rec_min_recommenders === null || data.rec_min_recommenders === undefined || data.rec_min_recommenders < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Minimum recommenders must be a non-negative number.",
          path: ['rec_min_recommenders'],
        });
      }
      if (data.rec_max_recommenders === null || data.rec_max_recommenders === undefined || data.rec_max_recommenders < (data.rec_min_recommenders || 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Maximum recommenders must be a number greater than or equal to minimum.",
          path: ['rec_max_recommenders'],
        });
      }
      if (data.rec_reminder_intervals_days) {
        const intervals = data.rec_reminder_intervals_days.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (intervals.some(n => n < 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Reminder intervals must be non-negative numbers.",
            path: ['rec_reminder_intervals_days'],
          });
        }
      }
    }
  });

  type EditWorkflowStageValues = z.infer<typeof editWorkflowStageSchema>;

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
      let review_form_source_stage_order: number | undefined | null = undefined;
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
          review_form_source_stage_order = config.review_form_source_stage_order;
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
        review_form_source_stage_order: review_form_source_stage_order,
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
    let formIdPayload: string | null = values.form_id || null;

    if (values.step_type === 'decision') {
      const validOutcomes = values.decision_options?.filter(o => o.name.trim() !== '') || [];
      descriptionPayload = JSON.stringify({ outcomes: validOutcomes });
      formIdPayload = null;
    } else if (values.step_type === 'status') {
      const statusConfig: { message: string; tag: string; custom_tag?: string } = {
        message: values.status_message || '',
        tag: values.status_tag || 'Info',
      };
      if (values.status_tag === 'Custom') {
        statusConfig.custom_tag = values.status_custom_tag || '';
      }
      descriptionPayload = JSON.stringify(statusConfig);
      formIdPayload = null;
    } else if (values.step_type === 'resubmission') {
      descriptionPayload = JSON.stringify({ resubmission_for_stage_order: values.resubmission_for_stage_order });
      formIdPayload = null;
    } else if (values.step_type === 'review') {
      descriptionPayload = JSON.stringify({
        anonymize_identity: values.anonymize_identity,
        review_form_source_stage_order: values.review_form_source_stage_order,
      });
      formIdPayload = null;
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
      formIdPayload = null;
    } else if (values.step_type !== 'form') {
      formIdPayload = null;
    }

    const finalValues: Partial<WorkflowStage> = {
      name: values.name,
      step_type: values.step_type,
      form_id: formIdPayload,
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
          {!form.formState.isValid && form.formState.isSubmitted && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription>
                Please correct the errors in the form before saving.
                {form.formState.errors.root?.message && (
                  <p className="mt-2">{form.formState.errors.root.message}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

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
            selectedStageType={selectedStageType}
          />

          {selectedStageType === 'review' && (
            <ReviewProperties
              form={form}
              publishedEvaluationTemplates={publishedEvaluationTemplates}
              allStages={allStages}
              currentStageId={stage.id}
            />
          )}

          {selectedStageType !== 'email' && selectedStageType !== 'decision' && selectedStageType !== 'recommendation' && (
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

          {selectedStageType === 'form' && (
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