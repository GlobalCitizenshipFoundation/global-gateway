import { z } from "zod";
import { WorkflowStage, EmailTemplate, Form } from "@/types";

// Define Zod schemas for nested objects that go into `description` JSON
const decisionOutcomeSchema = z.object({
  name: z.string().min(1, "Outcome name cannot be empty."),
  email_template_id: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

const statusConfigSchema = z.object({
  message: z.string().min(1, "Status message cannot be empty."),
  tag: z.string().min(1, "Status tag is required."),
  custom_tag: z.string().optional(),
});

const recommendationConfigSchema = z.object({
  form_id: z.string().min(1, "A recommendation form must be selected."),
  min_recommenders: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      return Number(val);
    },
    z.number().nullable().optional().refine(val => val === null || val === undefined || val >= 0, "Minimum recommenders must be non-negative.")
  ),
  max_recommenders: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return null;
      return Number(val);
    },
    z.number().nullable().optional().refine(val => val === null || val === undefined || val >= 0, "Maximum recommenders must be non-negative.") // Added refine for max_recommenders too
  ),
  reminder_email_template_id: z.string().nullable().optional(),
  reminder_intervals_days: z.string().optional(), // Stored as comma-separated string
  anonymize_recommender_identity: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.min_recommenders !== null && data.min_recommenders !== undefined &&
      data.max_recommenders !== null && data.max_recommenders !== undefined &&
      (data.max_recommenders < data.min_recommenders)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Maximum recommenders must be greater than or equal to minimum.",
      path: ['max_recommenders'],
    });
  }
  if (data.reminder_intervals_days) {
    const intervals = data.reminder_intervals_days.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (intervals.some(n => n < 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reminder intervals must be non-negative numbers.",
        path: ['reminder_intervals_days'],
      });
    }
  }
});


// Main schema creation function
export const createWorkflowStageSchema = (allStages: WorkflowStage[], publishedEmailTemplates: EmailTemplate[], publishedForms: Form[]) => {
  return z.object({
    name: z.string().min(1, { message: "Stage name cannot be empty." }),
    description: z.string().nullable().optional(), // General description, overridden by specific configs
    step_type: z.enum(['form', 'screening', 'review', 'resubmission', 'decision', 'email', 'scheduling', 'status', 'recommendation']),
    form_id: z.string().nullable().optional(),
    email_template_id: z.string().nullable().optional(),
    evaluation_template_id: z.string().nullable().optional(),
    anonymize_identity: z.boolean().optional(),
    review_form_source_stage_id: z.string().nullable().optional(), // Changed from _order to _id
    decision_options: z.array(decisionOutcomeSchema).optional(),
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
    // Type-specific validations
    if (data.step_type === 'form' && !data.form_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A form must be selected for this stage.", path: ['form_id'] });
    }

    if (data.step_type === 'email' && !data.email_template_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "An email template must be selected for this stage.", path: ['email_template_id'] });
    }

    if (data.step_type === 'status') {
      const statusValidation = statusConfigSchema.safeParse({
        message: data.status_message,
        tag: data.status_tag,
        custom_tag: data.status_custom_tag,
      });
      if (!statusValidation.success) {
        statusValidation.error.issues.forEach(issue => {
          ctx.addIssue({ ...issue, path: ['status_' + issue.path[0]] });
        });
      }
      if (data.status_tag === 'Custom' && (!data.status_custom_tag || data.status_custom_tag.trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Custom tag text is required when 'Custom' is selected.", path: ['status_custom_tag'] });
      }
    }

    if (data.step_type === 'resubmission' && (data.resubmission_for_stage_order === null || data.resubmission_for_stage_order === undefined)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A target form stage must be selected for resubmission.", path: ['resubmission_for_stage_order'] });
    }

    if (data.step_type === 'review') {
      if (!data.evaluation_template_id) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "An evaluation rubric must be selected for this stage.", path: ['evaluation_template_id'] });
      }
      
      if (data.review_form_source_stage_id === null || data.review_form_source_stage_id === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A form to review must be selected.', path: ['review_form_source_stage_id'] });
      } else {
        const sourceStage = allStages.find((s: WorkflowStage) => s.id === data.review_form_source_stage_id); // Find by ID
        if (!sourceStage) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `The selected form to review does not exist.`, path: ['review_form_source_stage_id'] });
        } else if (sourceStage.step_type !== 'form') {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `The selected form to review ('${sourceStage.name}') is not a 'Form' stage.`, path: ['review_form_source_stage_id'] });
        }
      }
    }

    if (data.step_type === 'decision') {
      if (!data.decision_options || data.decision_options.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one decision outcome must be defined.", path: ['decision_options'] });
      } else {
        data.decision_options.forEach((outcome, index) => {
          const outcomeValidation = decisionOutcomeSchema.safeParse(outcome);
          if (!outcomeValidation.success) {
            outcomeValidation.error.issues.forEach(issue => {
              ctx.addIssue({ ...issue, path: ['decision_options', index, ...issue.path] });
            });
          }
          if (outcome.email_template_id) {
            const templateExistsAndIsPublished = publishedEmailTemplates.some(t => t.id === outcome.email_template_id);
            if (!templateExistsAndIsPublished) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Outcome "${outcome.name}" is linked to an unpublished or non-existent email template.`, path: ['decision_options', index, 'email_template_id'] });
            }
          }
        });
      }
    }

    if (data.step_type === 'recommendation') {
      const recommendationValidation = recommendationConfigSchema.safeParse({
        form_id: data.rec_form_id,
        min_recommenders: data.rec_min_recommenders,
        max_recommenders: data.rec_max_recommenders,
        reminder_email_template_id: data.rec_reminder_email_template_id,
        reminder_intervals_days: data.rec_reminder_intervals_days,
        anonymize_recommender_identity: data.rec_anonymize_recommender_identity,
      });
      if (!recommendationValidation.success) {
        recommendationValidation.error.issues.forEach(issue => {
          ctx.addIssue({ ...issue, path: ['rec_' + issue.path[0]] });
        });
      }
      if (data.rec_form_id) {
        const formExistsAndIsPublished = publishedForms.some(f => f.id === data.rec_form_id);
        if (!formExistsAndIsPublished) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'The selected recommendation form is not published or does not exist.', path: ['rec_form_id'] });
        }
      }
      if (data.rec_reminder_email_template_id) {
        const templateExistsAndIsPublished = publishedEmailTemplates.some(t => t.id === data.rec_reminder_email_template_id);
        if (!templateExistsAndIsPublished) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'The selected reminder email template is not published or does not exist.', path: ['rec_reminder_email_template_id'] });
        }
      }
    }
  });
};

// Function to create the payload for Supabase update
export const createStagePayload = (values: any): Partial<WorkflowStage> => {
  console.log("createStagePayload: Incoming values:", values); // Debug log

  let descriptionPayload: string | null = values.description || null;
  let formIdPayload: string | null = values.form_id || null;
  let emailTemplateIdPayload: string | null = values.email_template_id || null;
  let evaluationTemplateIdPayload: string | null = values.evaluation_template_id || null;

  switch (values.step_type) {
    case 'decision':
      const validOutcomes = values.decision_options?.filter((o: any) => o.name.trim() !== '') || [];
      descriptionPayload = JSON.stringify({ outcomes: validOutcomes });
      formIdPayload = null;
      emailTemplateIdPayload = null;
      evaluationTemplateIdPayload = null;
      break;
    case 'status':
      const statusConfig = {
        message: values.status_message || '',
        tag: values.status_tag || 'Info',
        ...(values.status_tag === 'Custom' && { custom_tag: values.status_custom_tag || '' }),
      };
      descriptionPayload = JSON.stringify(statusConfig);
      formIdPayload = null;
      emailTemplateIdPayload = null;
      evaluationTemplateIdPayload = null;
      break;
    case 'resubmission':
      descriptionPayload = JSON.stringify({ resubmission_for_stage_order: values.resubmission_for_stage_order });
      formIdPayload = null;
      emailTemplateIdPayload = null;
      evaluationTemplateIdPayload = null;
      break;
    case 'review':
      descriptionPayload = JSON.stringify({
        anonymize_identity: values.anonymize_identity ?? false, // Ensure boolean, default to false
        // Ensure review_form_source_stage_id is always a string when writing to description
        review_form_source_stage_id: values.review_form_source_stage_id ?? null, // This should now be a string ID or null
      });
      formIdPayload = null;
      emailTemplateIdPayload = null;
      // evaluation_template_id is a direct column, not part of description JSON
      break;
    case 'recommendation':
      const reminderIntervals = values.rec_reminder_intervals_days?.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n)) || [];
      descriptionPayload = JSON.stringify({
        form_id: values.rec_form_id,
        min_recommenders: values.rec_min_recommenders,
        max_recommenders: values.rec_max_recommenders,
        reminder_email_template_id: values.rec_reminder_email_template_id,
        reminder_intervals_days: reminderIntervals,
        anonymize_recommender_identity: values.rec_anonymize_recommender_identity,
      });
      formIdPayload = null;
      emailTemplateIdPayload = null;
      evaluationTemplateIdPayload = null;
      break;
    case 'form':
      // form_id is handled directly, description is general
      emailTemplateIdPayload = values.email_template_id; // Keep generic email trigger
      evaluationTemplateIdPayload = null;
      break;
    default: // For 'screening', 'scheduling'
      formIdPayload = null;
      emailTemplateIdPayload = values.email_template_id; // Keep generic email trigger
      evaluationTemplateIdPayload = null;
      break;
  }

  return {
    name: values.name,
    step_type: values.step_type,
    form_id: formIdPayload,
    email_template_id: emailTemplateIdPayload,
    evaluation_template_id: evaluationTemplateIdPayload,
    description: descriptionPayload,
  };
};