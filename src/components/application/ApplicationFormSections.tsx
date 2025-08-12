import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField, FormSection } from "@/types";
import FormFieldRenderer from "./FormFieldRenderer"; // Ensure this import is correct
import { useFormContext } from "react-hook-form";

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
        if (fieldsInSection.length === 0) return null;

        return (
          <Card key={section.id} className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">{section.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {fieldsInSection.map(field => (
                <FormFieldRenderer key={field.id} field={field} submitting={submitting} />
              ))}
            </CardContent>
          </Card>
        );
      })}

      {uncategorizedFields.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Additional Information</CardTitle>
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