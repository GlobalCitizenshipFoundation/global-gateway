import { EvaluationCriterion } from '@/types';

export interface CriterionValidationResult {
  isValid: boolean;
  message: string | null;
}

export const validateCriterion = (criterion: EvaluationCriterion): CriterionValidationResult => {
  if (!criterion.label || criterion.label.trim() === '') {
    return { isValid: false, message: 'Criterion label cannot be empty.' };
  }

  if (['single_select', 'repeater_buttons'].includes(criterion.criterion_type) && (!criterion.options || criterion.options.length === 0 || criterion.options.some(opt => !opt.label || opt.label.trim() === ''))) {
    return { isValid: false, message: 'Each option must have a label.' };
  }

  if (['numerical_score', 'number_scale'].includes(criterion.criterion_type)) {
    if (criterion.min_score === null || criterion.min_score === undefined || criterion.max_score === null || criterion.max_score === undefined) {
      return { isValid: false, message: 'Score fields must have a minimum and maximum score.' };
    }
    if (criterion.min_score >= criterion.max_score) {
      return { isValid: false, message: 'Minimum score must be less than maximum score.' };
    }
  }

  return { isValid: true, message: null };
};

export const isEvaluationTemplatePublishable = (criteria: EvaluationCriterion[]): { publishable: boolean; errors: Map<string, string> } => {
  const errors = new Map<string, string>();
  let publishable = true;

  if (criteria.length === 0) {
    publishable = false;
    // No specific criterion to attach the error to, so we can't add to map.
    // This case should be handled in the UI.
  }

  criteria.forEach(criterion => {
    const { isValid, message } = validateCriterion(criterion);
    if (!isValid && message) {
      publishable = false;
      errors.set(criterion.id, message);
    }
  });

  return { publishable, errors };
};