import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormSection } from "@/types";
import FormFieldRenderer from "./FormFieldRenderer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import DOMPurify from 'dompurify';

interface ApplicationFormSectionsProps {
  formSections: FormSection[];
  displayedFormFields: FormField[];
  submitting: boolean;
}

const ApplicationFormSections = ({
  formSections,
  displayedFormFields,
  submitting,
}: ApplicationFormSectionsProps) => {
  const getFieldsForSection = (sectionId: string | null) => {
    return displayedFormFields.filter(field => field.section_id === sectionId).sort((a, b) => a.order - b.order);
  };

  const uncategorizedFields = getFieldsForSection(null);

  return (
    <>
      {formSections.map(section => {
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
                    <TooltipContent side="top" align="center" forceMount> {/* Added forceMount */}
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
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No fields in this section.</p>
              )}
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