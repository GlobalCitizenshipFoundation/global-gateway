import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormSection, DisplayRule } from "@/types";
import FormFieldRenderer from "./FormFieldRenderer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import DOMPurify from 'dompurify';
import { shouldFieldBeDisplayed, evaluateRule } from '@/utils/forms/formFieldUtils';

interface ApplicationFormSectionsProps {
  formSections: FormSection[];
  displayedFormFields: FormField[];
  allFormFields: FormField[];
  currentResponses: Record<string, any>;
  submitting: boolean;
}

const ApplicationFormSections = ({
  formSections,
  displayedFormFields,
  allFormFields,
  currentResponses,
  submitting,
}: ApplicationFormSectionsProps) => {
  const getFieldsForSection = (sectionId: string | null): FormField[] => {
    return displayedFormFields.filter((field: FormField) => field.section_id === sectionId).sort((a: FormField, b: FormField) => a.order - b.order);
  };

  const shouldSectionBeDisplayed = (section: FormSection): boolean => {
    if (!section.display_rules || (section.display_rules as DisplayRule[]).length === 0) {
      return true;
    }

    const logicType = section.display_rules_logic_type || 'AND';

    if (logicType === 'AND') {
      return (section.display_rules as DisplayRule[]).every((rule: DisplayRule) => evaluateRule(rule, currentResponses, allFormFields));
    } else {
      return (section.display_rules as DisplayRule[]).some((rule: DisplayRule) => evaluateRule(rule, currentResponses, allFormFields));
    }
  };

  const uncategorizedFields = getFieldsForSection(null);

  return (
    <>
      {formSections.map((section: FormSection) => {
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
                fieldsInSection.map((field: FormField) => (
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
            {uncategorizedFields.map((field: FormField) => (
              <FormFieldRenderer key={field.id} field={field} submitting={submitting} />
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ApplicationFormSections;