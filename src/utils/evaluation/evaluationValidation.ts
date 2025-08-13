import { EvaluationCriterion } from '@/types';

export interface CriterionValidationResult {
  isValid: boolean;
  message: string | null;
}

export const validateCriterion = (criterion: EvaluationCriterion): CriterionValidationResult => {
  if (!criterion.label || criterion.label.trim() === '') {
    return { isValid: false, message: 'Criterion label cannot be empty.' };
  }

  if (criterion.criterion_type === 'select' && (!criterion.options || criterion.options.length === 0 || criterion.options.every(opt => opt.trim() === ''))) {
    return { isValid: false, message: 'Dropdown criterion must have at least one option.' };
  }

  if (criterion.criterion_type === 'number_scale') {
    if (criterion.min_score === null || criterion.min_score === undefined || criterion.max_score === null || criterion.max_score === undefined) {
      return { isValid: false, message: 'Number scale must have a minimum and maximum score.' };
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

  criteria.forEach(criterion => {
    const { isValid, message } = validateCriterion(criterion);
    if (!isValid && message) {
      publishable = false;
      errors.set(criterion.id, message);
    }
  });

  return { publishable, errors };
};