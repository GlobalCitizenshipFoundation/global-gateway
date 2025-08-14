import { WorkflowStage, EmailTemplate, Form } from '@/types';

export interface StageValidationResult {
  isValid: boolean;
  message: string | null;
}

export const validateWorkflowStage = (stage: WorkflowStage, allStages: WorkflowStage[], publishedEmailTemplates: EmailTemplate[], publishedForms: Form[]): StageValidationResult => {
  switch (stage.step_type) {
    case 'form':
      if (!stage.form_id) {
        return { isValid: false, message: 'A form must be selected for this stage.' };
      }
      break;
    
    case 'resubmission':
      try {
        const config = JSON.parse(stage.description || '{}');
        if (typeof config.resubmission_for_stage_order !== 'number') {
          return { isValid: false, message: 'A target form stage must be selected for resubmission.' };
        }
      } catch (e) {
        return { isValid: false, message: 'Resubmission configuration is invalid or incomplete.' };
      }
      break;

    case 'email':
      if (!stage.email_template_id) {
        return { isValid: false, message: 'An email template must be selected for this stage.' };
      }
      break;

    case 'decision':
      try {
        const config = JSON.parse(stage.description || '{}');
        if (!Array.isArray(config.outcomes) || config.outcomes.length === 0 || config.outcomes.some((o: any) => !o.name || o.name.trim() === '')) {
          return { isValid: false, message: 'At least one decision outcome with a name must be defined.' };
        }
        for (const outcome of config.outcomes) {
          if (outcome.email_template_id) {
            const templateExistsAndIsPublished = publishedEmailTemplates.some(t => t.id === outcome.email_template_id);
            if (!templateExistsAndIsPublished) {
              return { isValid: false, message: `Outcome "${outcome.name}" is linked to an unpublished or non-existent email template.` };
            }
          }
        }
      } catch (e) {
        return { isValid: false, message: 'Decision outcomes are not configured correctly.' };
      }
      break;
    
    case 'review':
      if (!stage.evaluation_template_id) {
        return { isValid: false, message: 'An evaluation rubric must be selected for this stage.' };
      }
      let reviewFormSourceStageOrder: number | undefined | null = null;
      try {
        const config = JSON.parse(stage.description || '{}');
        reviewFormSourceStageOrder = config.review_form_source_stage_order;
      } catch (e) {
        return { isValid: false, message: 'Review stage configuration is invalid or incomplete.' };
      }

      if (reviewFormSourceStageOrder === null || reviewFormSourceStageOrder === undefined) {
        return { isValid: false, message: 'A form to review must be selected.' };
      }
      // Check if the selected source stage actually exists and is a form stage before this one
      const sourceStage = allStages.find(s => s.order_index === reviewFormSourceStageOrder);
      if (!sourceStage || sourceStage.step_type !== 'form' || sourceStage.order_index >= stage.order_index) {
        return { isValid: false, message: "The selected form to review must be a valid 'Form' stage that appears before this review stage." };
      }
      break;

    case 'recommendation':
      try {
        const config = JSON.parse(stage.description || '{}');
        if (!config.form_id) {
          return { isValid: false, message: 'A recommendation form must be selected.' };
        }
        const formExistsAndIsPublished = publishedForms.some(f => f.id === config.form_id);
        if (!formExistsAndIsPublished) {
          return { isValid: false, message: 'The selected recommendation form is not published or does not exist.' };
        }
        if (typeof config.min_recommenders !== 'number' || config.min_recommenders < 0) {
          return { isValid: false, message: 'Minimum recommenders must be a non-negative number.' };
        }
        if (typeof config.max_recommenders !== 'number' || config.max_recommenders < config.min_recommenders) {
          return { isValid: false, message: 'Maximum recommenders must be a number greater than or equal to minimum.' };
        }
        if (config.reminder_email_template_id) {
          const templateExistsAndIsPublished = publishedEmailTemplates.some(t => t.id === config.reminder_email_template_id);
          if (!templateExistsAndIsPublished) {
            return { isValid: false, message: 'The selected reminder email template is not published or does not exist.' };
          }
        }
        if (config.reminder_intervals_days && (!Array.isArray(config.reminder_intervals_days) || config.reminder_intervals_days.some((n: any) => typeof n !== 'number' || n < 0))) {
          return { isValid: false, message: 'Reminder intervals must be a comma-separated list of non-negative numbers.' };
        }
      } catch (e) {
        return { isValid: false, message: 'Recommendation stage configuration is invalid or incomplete.' };
      }
      break;

    case 'screening':
    case 'scheduling':
    case 'status':
      // No specific validation rules for these types yet.
      break;
  }

  return { isValid: true, message: null };
};

export const isWorkflowPublishable = (stages: WorkflowStage[], publishedEmailTemplates: EmailTemplate[], publishedForms: Form[]): { publishable: boolean; errors: Map<string, string> } => {
  const errors = new Map<string, string>();
  let publishable = true;

  stages.forEach(stage => {
    // Pass allStages to validateCriterion
    const { isValid, message } = validateWorkflowStage(stage, stages, publishedEmailTemplates, publishedForms);
    if (!isValid && message) {
      publishable = false;
      errors.set(stage.id, message);
    }
  });

  return { publishable, errors };
};