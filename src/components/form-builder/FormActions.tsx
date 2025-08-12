import { Button } from "@/components/ui/button";
import { SaveAsTemplateDialog } from "@/components/forms/SaveAsTemplateDialog";
import FormPreviewDialog from "@/components/form-builder/FormPreviewDialog";
import { useFormBuilderState } from "@/hooks/useFormBuilderState";
import { useFormBuilderHandlers } from "@/hooks/useFormBuilderHandlers";
import { useFormBuilderActions } from "@/hooks/useFormBuilderActions";
import { useSession } from "@/contexts/SessionContext";

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
    hasUnsavedChanges,
    isAutoSaving,
    isUpdatingStatus,
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen,
    newTemplateName, setNewTemplateName,
    isSavingTemplate, setIsSavingTemplate,
    isFormPreviewOpen, setIsFormPreviewOpen,
    formLastEditedAt,
    formLastEditedByUserId,
    sections, // Pass sections for preview
    fields,   // Pass fields for preview
  } = state;

  const {
    handleManualSaveDraft,
    handleOpenPreview,
    handlePublishUnpublish,
    handleSaveAsTemplate,
  } = handlers;

  return (
    <>
      <div className="flex justify-between items-center mt-8 pt-4 border-t">
        <Button variant="outline" onClick={handleManualSaveDraft} disabled={isAutoSaving || !hasUnsavedChanges}>
          {isAutoSaving ? "Saving Draft..." : "Save Draft"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenPreview}>
            Preview Form
          </Button>
          {formStatus === 'draft' ? (
            <Button onClick={() => handlePublishUnpublish('published')} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? 'Publishing...' : 'Publish Form'}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handlePublishUnpublish('draft')} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? 'Unpublishing...' : 'Unpublish Form'}
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsSaveAsTemplateDialogOpen(true)} disabled={isSavingTemplate}>
            Save as Template
          </Button>
        </div>
      </div>

      <SaveAsTemplateDialog
        isOpen={isSaveAsTemplateDialogOpen}
        onClose={() => setIsSaveAsTemplateDialogOpen(false)}
        formToCopy={{
          id: formId || '',
          name: formName,
          description: formDescription,
          is_template: false,
          status: formStatus,
          user_id: user?.id || '',
          created_at: '', // Placeholder, will be overwritten by DB
          updated_at: '', // Placeholder, will be overwritten by DB
          last_edited_by_user_id: formLastEditedByUserId, // Include fetched value
          last_edited_at: formLastEditedAt, // Include fetched value
        }}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        isSaving={isSavingTemplate}
        onSave={handleSaveAsTemplate}
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