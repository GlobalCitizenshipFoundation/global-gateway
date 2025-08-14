import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormSection } from "@/types";
import FormFieldRenderer from "./FormFieldRenderer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import DOMPurify from 'dompurify';
import { shouldFieldBeDisplayed, evaluateRule } from '@/utils/forms/formFieldUtils'; // Import evaluateRule

interface ApplicationFormSectionsProps {
  formSections: FormSection[];
  displayedFormFields: FormField[]; // These are the fields that are currently displayed based on their own logic
  allFormFields: FormField[]; // All fields, including hidden ones, for conditional logic evaluation
  currentResponses: Record<string, any>; // Current form responses for conditional logic evaluation
  submitting: boolean;
}

const ApplicationFormSections = ({
  formSections,
  displayedFormFields,
  allFormFields, // Passed for conditional logic evaluation
  currentResponses, // Passed for conditional logic evaluation
  submitting,
}: ApplicationFormSectionsProps) => {
  const getFieldsForSection = (sectionId: string | null) => {
    return displayedFormFields.filter(field => field.section_id === sectionId).sort((a, b) => a.order - b.order);
  };

  // Function to determine if a section should be displayed
  const shouldSectionBeDisplayed = (section: FormSection): boolean => {
    if (!section.display_rules || section.display_rules.length === 0) {
      return true; // No rules, always display
    }

    const logicType = section.display_rules_logic_type || 'AND';

    if (logicType === 'AND') {
      return section.display_rules.every(rule => evaluateRule(rule, currentResponses, allFormFields));
    } else { // OR logic
      return section.display_rules.some(rule => evaluateRule(rule, currentResponses, allFormFields));
    }
  };

  const uncategorizedFields = getFieldsForSection(null);

  return (
    <>
      {formSections.map(section => {
        // Only render the section if its display rules are met
        if (!shouldSectionBeDisplayed(section)) {
          return null;
        }

        const fieldsInSection = getFieldsForSection(section.id);
        const sanitizedDescription = section.description ? DOMPurify.sanitize(section.description, { USE_PROFILES: { html: true } }) : null;
        const hasTooltip = section.tooltip && section.tooltip.trim() !== '';

        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-bold">{section.name}</CardTitle>
                {hasTooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center">
                      <p>{section.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {sanitizedDescription && (
                <CardDescription>
                  <div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} className="prose max-w-none" />
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="grid gap-6">
              {fieldsInSection.length > 0 ? (
                fieldsInSection.map(field => (
                  <FormFieldRenderer key={field.id} field={field} submitting={submitting} />
                ))
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      {uncategorizedFields.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Additional Information</CardTitle>
            <CardDescription>Fields not assigned to a specific section.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {uncategorizedFields.map(field => (
              <FormFieldRenderer key={field.id} field={field} submitting={submitting} />
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ApplicationFormSections;