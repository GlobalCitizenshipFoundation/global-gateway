import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField, FormSection } from '@/types';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ApplicationFormSections from '@/components/application/ApplicationFormSections';
import { ApplicantInfoCard } from '@/components/application/ApplicantInfoCard';
import DOMPurify from 'dompurify';
import { TooltipProvider } from '@/components/ui/tooltip'; // Required for tooltips in preview
import { shouldFieldBeDisplayed } from '@/utils/formFieldUtils'; // Import the missing utility

interface FormPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formName: string;
  formDescription: string | null;
  formSections: FormSection[];
  formFields: FormField[];
}

// Define a dynamic schema for the preview form, making all fields optional
// This is because we are only previewing, not validating submission.
const createPreviewSchema = (fields: FormField[]) => {
  const schemaFields: { [key: string]: z.ZodTypeAny } = {};
  fields.forEach(field => {
    // For preview, all fields are optional and can be any type
    schemaFields[field.id] = z.any().optional().nullable();
  });
  return z.object(schemaFields);
};

const FormPreviewDialog = ({
  isOpen,
  onClose,
  formName,
  formDescription,
  formSections,
  formFields,
}: FormPreviewDialogProps) => {
  const [currentResponses, setCurrentResponses] = useState<Record<string, any>>({});

  // Create a dynamic form instance for the preview, using a relaxed schema
  const previewSchema = createPreviewSchema(formFields);
  const form = useForm<Record<string, any>>({
    resolver: zodResolver(previewSchema),
    defaultValues: {}, // No default values needed for preview
    mode: "onChange", // Update responses on change for conditional logic
  });

  const { watch, setValue } = form;

  // Watch all fields to update currentResponses for conditional logic evaluation
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name) {
        setCurrentResponses(prev => ({ ...prev, [name]: value[name] }));
      } else {
        // If no specific name, it means all fields changed (e.g., on initial load)
        setCurrentResponses(value);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Initialize responses when formFields change (e.g., when dialog opens with new form data)
  useEffect(() => {
    const initialResponses: Record<string, any> = {};
    formFields.forEach(field => {
      if (field.field_type === 'checkbox') {
        initialResponses[field.id] = [];
      } else if (field.field_type === 'number') {
        initialResponses[field.id] = undefined;
      } else {
        initialResponses[field.id] = '';
      }
    });
    form.reset(initialResponses);
    setCurrentResponses(initialResponses);
  }, [formFields, form]);

  // Filter fields based on conditional logic for display in preview
  const displayedFormFields = formFields.filter(field =>
    shouldFieldBeDisplayed(field, currentResponses, formFields)
  );

  const sanitizedDescription = formDescription ? DOMPurify.sanitize(formDescription, { USE_PROFILES: { html: true } }) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{formName} - Preview</DialogTitle>
          {formDescription && (
            <DialogDescription>
              <div dangerouslySetInnerHTML={{ __html: sanitizedDescription || '' }} className="prose max-w-none" />
            </DialogDescription>
          )}
          <DialogDescription>
            This is a live preview of your form. You can interact with fields to test conditional logic.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <TooltipProvider> {/* Wrap with TooltipProvider for tooltips to work */}
            <FormProvider {...form}>
              <form className="grid gap-6">
                {/* Applicant Info Card is not dynamic, so it can be hardcoded for preview */}
                <ApplicantInfoCard fullName="Preview Applicant" email="preview@example.com" />

                <ApplicationFormSections
                  formSections={formSections}
                  displayedFormFields={displayedFormFields}
                  submitting={false} // Always false for preview
                />

                {formFields.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground">This form does not have any fields yet.</p>
                )}
              </form>
            </FormProvider>
          </TooltipProvider>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormPreviewDialog;