import { DisplayRule, FormField } from "@/types";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import React from "react";
import DOMPurify from 'dompurify';

/**
 * Evaluates a single display rule against current form responses.
 * @param rule The display rule to evaluate.
 * @param currentResponsesMap A map of field IDs to their current response values.
 * @param allFormFields An array of all available form fields, including their types and options.
 * @returns True if the rule condition is met, false otherwise.
 */
export const evaluateRule = (rule: DisplayRule, currentResponsesMap: Record<string, any>, allFormFields: FormField[]): boolean => {
  const triggerFieldResponse = currentResponsesMap[rule.field_id];
  const triggerField = allFormFields.find(f => f.id === rule.field_id);

  if (!triggerField) return false; // Trigger field not found

  let normalizedResponse: any = triggerFieldResponse;
  if (triggerField.field_type === 'checkbox') {
    try {
      normalizedResponse = typeof triggerFieldResponse === 'string' ? JSON.parse(triggerFieldResponse) : triggerFieldResponse;
    } catch {
      normalizedResponse = [];
    }
    if (!Array.isArray(normalizedResponse)) normalizedResponse = [];
  } else if (triggerField.field_type === 'number' || triggerField.field_type === 'rating') {
    normalizedResponse = typeof triggerFieldResponse === 'string' ? parseFloat(triggerFieldResponse) : triggerFieldResponse;
    if (isNaN(normalizedResponse)) normalizedResponse = undefined;
  } else if (triggerField.field_type === 'date') {
    normalizedResponse = triggerFieldResponse ? new Date(triggerFieldResponse) : undefined;
  } else {
    normalizedResponse = typeof triggerFieldResponse === 'string' ? triggerFieldResponse : String(triggerFieldResponse || '');
  }

  const ruleValue = triggerField.field_type === 'date' && typeof rule.value === 'string' ? new Date(rule.value) : rule.value;

  switch (rule.operator) {
    case 'equals':
      if (triggerField.field_type === 'checkbox') {
        return Array.isArray(rule.value) && Array.isArray(normalizedResponse) && rule.value.every(val => normalizedResponse.includes(val));
      }
      return normalizedResponse === rule.value;
    case 'not_equals':
      if (triggerField.field_type === 'checkbox') {
        return Array.isArray(rule.value) && Array.isArray(normalizedResponse) && !rule.value.every(val => normalizedResponse.includes(val));
      }
      return normalizedResponse !== rule.value;
    case 'contains':
      return typeof normalizedResponse === 'string' && typeof rule.value === 'string' && normalizedResponse.includes(rule.value);
    case 'not_contains':
      return typeof normalizedResponse === 'string' && typeof rule.value === 'string' && !normalizedResponse.includes(rule.value);
    case 'is_empty':
      if (triggerField.field_type === 'checkbox') {
        return Array.isArray(normalizedResponse) && normalizedResponse.length === 0;
      }
      if (triggerField.field_type === 'number' || triggerField.field_type === 'rating') {
        return normalizedResponse === undefined || normalizedResponse === null;
      }
      return !normalizedResponse || String(normalizedResponse).trim() === '';
    case 'is_not_empty':
      if (triggerField.field_type === 'checkbox') {
        return Array.isArray(normalizedResponse) && normalizedResponse.length > 0;
      }
      if (triggerField.field_type === 'number' || triggerField.field_type === 'rating') {
        return normalizedResponse !== undefined && normalizedResponse !== null;
      }
      return !!normalizedResponse && String(normalizedResponse).trim() !== '';
    case 'greater_than':
      return typeof normalizedResponse === 'number' && typeof ruleValue === 'number' && normalizedResponse > ruleValue;
    case 'less_than':
      return typeof normalizedResponse === 'number' && typeof ruleValue === 'number' && normalizedResponse < ruleValue;
    case 'is_before':
      return normalizedResponse instanceof Date && ruleValue instanceof Date && normalizedResponse < ruleValue;
    case 'is_after':
      return normalizedResponse instanceof Date && ruleValue instanceof Date && normalizedResponse > ruleValue;
    default:
      return false;
  }
};

/**
 * Determines if a form field should be displayed based on its display rules and current responses.
 * @param field The form field to check.
 * @param currentResponsesMap A map of field IDs to their current response values.
 * @param allFormFields An array of all available form fields, including their types and options.
 * @returns True if the field should be displayed, false otherwise.
 */
export const shouldFieldBeDisplayed = (field: FormField, currentResponsesMap: Record<string, any>, allFormFields: FormField[]): boolean => {
  if (!field.display_rules || field.display_rules.length === 0) {
    return true; // No rules, always display
  }

  const logicType = field.display_rules_logic_type || 'AND';

  if (logicType === 'AND') {
    return field.display_rules.every(rule => evaluateRule(rule, currentResponsesMap, allFormFields));
  } else { // OR logic
    return field.display_rules.some(rule => evaluateRule(rule, currentResponsesMap, allFormFields));
  }
};

/**
 * Formats a response value for display based on its field type.
 * @param value The raw response value.
 * @param fieldType The type of the form field.
 * @returns The formatted value, which can be a string or a ReactNode (for links/rich text).
 */
export const formatResponseValue = (value: string | null, fieldType: FormField['field_type'] | null): React.ReactNode => {
  if (!value) return 'No answer provided';

  if (fieldType === 'checkbox') {
    try {
      const values = JSON.parse(value);
      return Array.isArray(values) ? values.join(', ') : value;
    } catch (e) {
      return value; // Fallback for malformed data
    }
  }
  if (fieldType === 'date') {
    try {
      return format(new Date(value), "PPP");
    } catch (e) {
      return value; // Fallback for invalid date string
    }
  }
  if (fieldType === 'text') {
    try {
      new URL(value); // Validate if it's a valid URL
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
          <ExternalLink className="h-4 w-4" /> {value}
        </a>
      );
    } catch (e) {
      // Not a valid URL, display as plain text
      return value;
    }
  }
  if (fieldType === 'richtext') {
    // Sanitize HTML content to prevent XSS attacks
    const cleanHtml = DOMPurify.sanitize(value, { USE_PROFILES: { html: true } });
    return (
      <div dangerouslySetInnerHTML={{ __html: cleanHtml }} className="prose max-w-none" />
    );
  }
  return value;
};