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
export const evaluateRule = (rule: DisplayRule, currentResponsesMap: Record<string, string>, allFormFields: FormField[]): boolean => {
  const triggerFieldResponse = currentResponsesMap[rule.field_id];
  const triggerField = allFormFields.find(f => f.id === rule.field_id);

  if (!triggerField) return false; // Trigger field not found

  switch (rule.operator) {
    case 'equals':
      if (triggerField.field_type === 'checkbox') {
        try {
          const responseArray = JSON.parse(triggerFieldResponse || '[]') as string[];
          return Array.isArray(rule.value) ? rule.value.every(val => responseArray.includes(val)) : responseArray.includes(rule.value as string);
        } catch {
          return false;
        }
      }
      return triggerFieldResponse === rule.value;
    case 'not_equals':
      if (triggerField.field_type === 'checkbox') {
        try {
          const responseArray = JSON.parse(triggerFieldResponse || '[]') as string[];
          return Array.isArray(rule.value) ? !rule.value.every(val => responseArray.includes(val)) : !responseArray.includes(rule.value as string);
        } catch {
          return true;
        }
      }
      return triggerFieldResponse !== rule.value;
    case 'contains':
      return typeof triggerFieldResponse === 'string' && typeof rule.value === 'string' && triggerFieldResponse.includes(rule.value);
    case 'not_contains':
      return typeof triggerFieldResponse === 'string' && typeof rule.value === 'string' && !triggerFieldResponse.includes(rule.value);
    case 'is_empty':
      if (triggerField.field_type === 'checkbox') {
        try {
          const responseArray = JSON.parse(triggerFieldResponse || '[]') as string[];
          return responseArray.length === 0;
        } catch {
          return true;
        }
      }
      return !triggerFieldResponse || triggerFieldResponse.trim() === '';
    case 'is_not_empty':
      if (triggerField.field_type === 'checkbox') {
        try {
          const responseArray = JSON.parse(triggerFieldResponse || '[]') as string[];
          return responseArray.length > 0;
        } catch {
          return false;
        }
      }
      return !!triggerFieldResponse && triggerFieldResponse.trim() !== '';
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
export const shouldFieldBeDisplayed = (field: FormField, currentResponsesMap: Record<string, string>, allFormFields: FormField[]): boolean => {
  if (!field.display_rules || field.display_rules.length === 0) {
    return true; // No rules, always display
  }
  // Assuming 'AND' logic for multiple rules for simplicity
  return field.display_rules.every(rule => evaluateRule(rule, currentResponsesMap, allFormFields));
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