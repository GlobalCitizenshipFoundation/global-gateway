import { useEffect } from 'react';
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
import { createWorkflowStageSchema, createStagePayload } from '@/utils/workflow/workflowFormUtils';
import { zodResolver } from "@hookform/resolvers/zod";

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
  // Filter published templates and forms for validation and dropdowns
  const publishedEvaluationTemplates = evaluationTemplates.filter(t => t.status === 'published');
  const publishedForms = forms.filter(f => f.status === 'published');
  const publishedEmailTemplates = emailTemplates.filter(t => t.status === 'published');

  // Create the schema dynamically based on current data
  const editWorkflowStageSchema = createWorkflowStageSchema(allStages, publishedEmailTemplates, publishedForms);

  type EditWorkflowStageValues = z.infer<typeof editWorkflowStageSchema>;

  const form = useForm<EditWorkflowStageValues>({
    resolver: zodResolver(editWorkflowStageSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (stage) {
      let decision_options: EditWorkflowStageValues['decision_options'] = undefined;
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

      // Parse description JSON based on step_type
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
        }  catch (e) { /* Not valid JSON */ }
      } else if (stage.step_type === 'review' && stage.description) {
        try {
          const config = JSON.parse(stage.description);
          anonymize_identity = config.anonymize_identity || false;
          review_form_source_stage_order = config.review_form_source_stage_order;
          standard_description = '';
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

      // Reset form with current stage data
      form.reset({
        name: stage.name,
        description: standard_description,
        step_type: stage.step_type,
        form_id: stage.form_id || null,
        email_template_id: stage.email_template_id || null,
        evaluation_template_id: stage.evaluation_template_id || null,
        anonymize_identity: anonymize_identity || false,
        review_form_source_stage_order: review_form_source_stage_order,
        decision_options: decision_options || [ // Default decision options if none are set
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
    const finalValues = createStagePayload(values);
    onSave(stage.id, finalValues);
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
          {/* Display general form errors if any */}
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

          {/* General Properties (Name and generic Description) */}
          <GeneralProperties
            form={form}
            selectedStageType={selectedStageType}
          />

          {/* Review Specific Properties */}
          {selectedStageType === 'review' && (
            <ReviewProperties
              form={form}
              publishedEvaluationTemplates={publishedEvaluationTemplates}
              allStages={allStages}
              currentStageId={stage.id}
            />
          )}

          {/* Generic Email Trigger (for stages that aren't 'email' type itself) */}
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

          {/* Resubmission Specific Properties */}
          {selectedStageType === 'resubmission' && (
            <ResubmissionProperties
              form={form}
              allStages={allStages}
              currentStageId={stage.id}
            />
          )}

          {/* Decision Specific Properties */}
          {selectedStageType === 'decision' && (
            <DecisionProperties
              form={form}
              emailTemplates={emailTemplates}
            />
          )}

          {/* Status Specific Properties */}
          {selectedStageType === 'status' && (
            <StatusProperties
              form={form}
            />
          )}

          {/* Recommendation Specific Properties */}
          {selectedStageType === 'recommendation' && (
            <RecommendationProperties
              form={form}
              publishedForms={publishedForms}
              emailTemplates={emailTemplates}
            />
          )}

          {/* Form Attachment Properties (only for 'form' type) */}
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