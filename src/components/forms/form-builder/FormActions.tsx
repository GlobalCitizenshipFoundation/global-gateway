import { Button } from "@/components/ui/button";
import { SaveAsTemplateDialog } from "@/components/forms/SaveAsTemplateDialog";
import FormPreviewDialog from "@/components/forms/form-builder/FormPreviewDialog";
import { useFormBuilderState } from "@/hooks/forms/useFormBuilderState";
import { useFormBuilderHandlers } from "@/hooks/forms/useFormBuilderHandlers";
import { useSession } from "@/contexts/auth/SessionContext";
import { Form as FormType } from "@/types"; // Import FormType

interface FormActionsProps {
  state: ReturnType<typeof useFormBuilderState>;
  handlers: ReturnType<typeof useFormBuilderHandlers>;
}

export const FormActions = ({ state, handlers }: FormActionsProps) => {
  const { user } = useSession();
  const {
    formId,
    formName,
    formDescription,
    formStatus,
    isTemplate,
    hasUnsavedChanges,
    isAutoSaving,
    isUpdatingStatus,
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen,
    newTemplateName, setNewTemplateName,
    isSavingTemplate, setIsSavingTemplate,
    isFormPreviewOpen, setIsFormPreviewOpen,
    formLastEditedAt,
    formLastEditedByUserId,
    sections,
    fields,
  } = state;

  const {
    handleManualSaveDraft,
    handleOpenPreview,
    handlePublishUnpublish,
    handleSaveAsTemplate,
  } = handlers;

  // Create a FormType object for formToCopy
  const formToCopy: FormType = {
    id: formId || '',
    name: formName,
    description: formDescription,
    is_template: false, // This is the source form, not necessarily a template itself
    status: formStatus,
    user_id: user?.id || '',
    created_at: '', // Placeholder, not strictly needed for copying
    updated_at: '', // Placeholder
    last_edited_by_user_id: formLastEditedByUserId,
    last_edited_at: formLastEditedAt,
  };

  return (
    <>
      <div className="flex justify-between items-center mt-8 pt-4 border-t">
        <Button variant="outline" onClick={handleManualSaveDraft} disabled={isAutoSaving || !hasUnsavedChanges}>
          {isAutoSaving ? "Saving Draft..." : "Save Draft"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenPreview}>
            Preview {isTemplate ? "Template" : "Form"}
          </Button>
          {formStatus === 'draft' ? (
            <Button onClick={() => handlePublishUnpublish('published')} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? `Publishing ${isTemplate ? "Template" : "Form"}...` : `Publish ${isTemplate ? "Template" : "Form"}`}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handlePublishUnpublish('draft')} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? `Unpublishing ${isTemplate ? "Template" : "Form"}...` : `Unpublish ${isTemplate ? "Template" : "Form"}`}
            </Button>
          )}
          {!isTemplate && (
            <Button variant="outline" onClick={() => setIsSaveAsTemplateDialogOpen(true)} disabled={isSavingTemplate}>
              Save as Template
            </Button>
          )}
        </div>
      </div>

      <SaveAsTemplateDialog
        isOpen={isSaveAsTemplateDialogOpen}
        onClose={() => setIsSaveAsTemplateDialogOpen(false)}
        formToCopy={formToCopy}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        isSaving={isSavingTemplate}
        onSave={() => handleSaveAsTemplate(formToCopy, newTemplateName)}
      />

      <FormPreviewDialog
        isOpen={isFormPreviewOpen}
        onClose={() => setIsFormPreviewOpen(false)}
        formName={formName}
        formDescription={formDescription}
        formSections={sections}
        formFields={fields}
      />
    </>
  );
};