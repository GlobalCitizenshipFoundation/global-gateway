import { WorkflowStage, EmailTemplate } from '@/types';

export interface StageValidationResult {
  isValid: boolean;
  message: string | null;
}

export const validateWorkflowStage = (stage: WorkflowStage, publishedEmailTemplates: EmailTemplate[]): StageValidationResult => {
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
    
    case 'screening':
    case 'review':
    case 'scheduling':
    case 'status':
      // No specific validation rules for these types yet.
      break;
  }

  return { isValid: true, message: null };
};

export const isWorkflowPublishable = (stages: WorkflowStage[], publishedEmailTemplates: EmailTemplate[]): { publishable: boolean; errors: Map<string, string> } => {
  const errors = new Map<string, string>();
  let publishable = true;

  stages.forEach(stage => {
    const { isValid, message } = validateWorkflowStage(stage, publishedEmailTemplates);
    if (!isValid && message) {
      publishable = false;
      errors.set(stage.id, message);
    }
  });

  return { publishable, errors };
};