import { useCallback, useRef } from 'react';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { FormField, DisplayRule, Form as FormType, FormSection } from '@/types'; // Import FormSection
import { useFormBuilderState } from '@/hooks/forms/useFormBuilderState';
import { useFormBuilderActions } from '@/hooks/forms/useFormBuilderActions'; // Import the actions hook

interface UseFormBuilderHandlersProps {
  state: ReturnType<typeof useFormBuilderState>;
  // The properties 'performUpdateFormDetails' and 'performUpdateFormStatus'
  // are no longer expected here as useFormBuilderHandlers now accesses
  // them directly from useFormBuilderActions within this hook.
}

const AUTO_SAVE_DEBOUNCE_TIME = 2000; // 2 seconds
const SAVED_CONFIRMATION_DISPLAY_TIME = 2000; // 2 seconds

export const useFormBuilderHandlers = ({
  state,
}: UseFormBuilderHandlersProps) => {
  const { user } = useSession();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedConfirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    formId,
    formName, setFormName,
    formDescription, setFormDescription,
    formStatus, setFormStatus,
    sections, setSections,
    fields, setFields,
    fetchData,
    setIsAutoSaving,
    setLastSavedTimestamp,
    setHasUnsavedChanges,
    setIsUpdatingStatus,
    setShowSavedConfirmation,
    setFormLastEditedAt,
    setFormLastEditedByUserId,
    setIsSaveAsTemplateDialogOpen,
    setNewTemplateName,
    setIsSavingTemplate,
    setIsFormPreviewOpen,
    newSectionName, setNewSectionName,
    newSectionDescription, setNewSectionDescription,
    newSectionTooltip, setNewSectionTooltip,
    isAddingSection, setIsAddingSection,
    newFieldLabel, setNewFieldLabel,
    newFieldType, setNewFieldType,
    newFieldOptions, setNewFieldOptions,
    newFieldSectionId, setNewFieldSectionId,
    newFieldDescription, setNewFieldDescription,
    newFieldTooltip, setNewFieldTooltip,
    newFieldPlaceholder, setNewFieldPlaceholder,
    isAddingField, setIsAddingField,
  } = state;

  // Initialize actions from the dedicated hook
  const {
    handleAddSection: performAddSection,
    handleDeleteSection: performDeleteSection,
    handleSaveEditedSection: performSaveEditedSection, // Destructure new action
    handleAddField: performAddField,
    handleDeleteField: performDeleteField,
    handleToggleRequired: performToggleRequired,
    handleSaveLogic: performSaveLogic,
    handleSaveEditedField: performSaveEditedField,
    handleUpdateFieldLabel: performUpdateFieldLabel,
    handleUpdateFormStatus: performUpdateFormStatus,
    handleUpdateFormDetails: performUpdateFormDetails,
    handleSaveAsTemplate: performSaveAsTemplate, // Destructure the new action
  } = useFormBuilderActions({ formId, setSections, setFields, fetchData });

  const showSavedFeedback = useCallback(() => {
    if (savedConfirmationTimeoutRef.current) {
      clearTimeout(savedConfirmationTimeoutRef.current);
    }
    setShowSavedConfirmation(true);
    savedConfirmationTimeoutRef.current = setTimeout(() => {
      setShowSavedConfirmation(false);
    }, SAVED_CONFIRMATION_DISPLAY_TIME);
  }, [setShowSavedConfirmation]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setHasUnsavedChanges(true);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!formId || !user) return;

      setIsAutoSaving(true);
      const now = new Date().toISOString();
      const success = await performUpdateFormDetails(formId, formName, formDescription);
      
      if (success) {
        setLastSavedTimestamp(new Date(now));
        setFormLastEditedAt(now);
        setFormLastEditedByUserId(user.id);
        setHasUnsavedChanges(false);
        showSavedFeedback();
      } else {
        showError("Auto-save failed. Please check your connection.");
      }
      setIsAutoSaving(false);
    }, AUTO_SAVE_DEBOUNCE_TIME);
  }, [formId, formName, formDescription, user, performUpdateFormDetails, setIsAutoSaving, setLastSavedTimestamp, setHasUnsavedChanges, setShowSavedConfirmation, setFormLastEditedAt, setFormLastEditedByUserId, showSavedFeedback]);

  const handleAddSection = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim() || !formId || !user) return;

    setIsAddingSection(true);
    const newSection = await performAddSection(newSectionName, newSectionDescription, newSectionTooltip);

    if (newSection) {
      showSuccess("Section added successfully.");
      setNewSectionName('');
      setNewSectionDescription('');
      setNewSectionTooltip('');
      setNewFieldSectionId(newSection.id);
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
    setIsAddingSection(false);
  }, [formId, newSectionName, newSectionDescription, newSectionTooltip, user, setNewSectionName, setNewSectionDescription, setNewSectionTooltip, setNewFieldSectionId, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, setIsAddingSection, performAddSection, triggerAutoSave]);

  const handleDeleteSection = useCallback(async (sectionId: string, fieldAction: 'delete_fields' | 'uncategorize_fields' | 'move_to_section', targetSectionId: string | null = null) => {
    const success = await performDeleteSection(sectionId, fieldAction, targetSectionId);
    if (success) {
      showSuccess("Section deleted and fields handled successfully.");
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user?.id || null);
      triggerAutoSave();
    }
  }, [user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, performDeleteSection, triggerAutoSave]);

  const handleSaveEditedSection = useCallback(async (sectionId: string, values: { name: string; description: string | null; tooltip: string | null; }) => {
    if (!user) return;
    const success = await performSaveEditedSection(sectionId, values);
    if (success) {
      showSuccess("Section updated successfully!");
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, performSaveEditedSection, triggerAutoSave]);

  const handleAddField = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !formId || !user) return;

    setIsAddingField(true);
    const newField = await performAddField(newFieldLabel, newFieldType, newFieldOptions, newFieldSectionId, newFieldDescription, newFieldTooltip, newFieldPlaceholder);

    if (newField) {
      showSuccess("Field added successfully.");
      setNewFieldLabel('');
      setNewFieldOptions('');
      setNewFieldType('text');
      setNewFieldDescription('');
      setNewFieldTooltip('');
      setNewFieldPlaceholder('');
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
    setIsAddingField(false);
  }, [formId, newFieldLabel, newFieldType, newFieldOptions, newFieldSectionId, newFieldDescription, newFieldTooltip, newFieldPlaceholder, user, setNewFieldLabel, setNewFieldOptions, setNewFieldType, setNewFieldDescription, setNewFieldTooltip, setNewFieldPlaceholder, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, setIsAddingField, performAddField, triggerAutoSave]);

  const handleDeleteField = useCallback(async (fieldId: string) => {
    const success = await performDeleteField(fieldId);
    if (success) {
      showSuccess("Field deleted successfully.");
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user?.id || null);
      triggerAutoSave();
    }
  }, [user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, performDeleteField, triggerAutoSave]);

  const handleToggleRequired = useCallback(async (fieldId: string, isRequired: boolean) => {
    if (!user) return;
    const success = await performToggleRequired(fieldId, isRequired);
    if (success) {
      showSuccess("Field requirement updated.");
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, performToggleRequired, triggerAutoSave]);

  const handleSaveLogic = useCallback(async (fieldId: string, rules: DisplayRule[]) => {
    if (!user) return;
    const success = await performSaveLogic(fieldId, rules);
    if (success) {
      showSuccess("Display logic saved successfully!");
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, performSaveLogic, triggerAutoSave]);

  const handleSaveEditedField = useCallback(async (fieldId: string, values: {
    label: string;
    field_type: FormField['field_type'];
    options?: string;
    is_required: boolean;
    description?: string | null;
    tooltip?: string | null;
    placeholder?: string | null;
    section_id?: string | null;
    date_min?: string | null;
    date_max?: string | null;
    date_allow_past?: boolean;
    date_allow_future?: boolean;
    rating_min_value?: number | null;
    rating_max_value?: number | null;
    rating_min_label?: string | null;
    rating_max_label?: string | null;
  }) => {
    if (!user) return;
    const success = await performSaveEditedField(fieldId, values);
    if (success) {
      showSuccess("Field updated successfully!");
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, performSaveEditedField, triggerAutoSave]);

  const handleUpdateFieldLabel = useCallback(async (fieldId: string, newLabel: string) => {
    if (!user) return;
    const success = await performUpdateFieldLabel(fieldId, newLabel);
    if (success) {
      showSuccess("Field label updated.");
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, performUpdateFieldLabel, triggerAutoSave]);

  const handlePublishUnpublish = useCallback(async (status: 'draft' | 'published') => {
    if (!formId || !user) return false;
    setIsUpdatingStatus(true);
    const now = new Date().toISOString();
    const success = await performUpdateFormStatus(formId, status);
    if (success) {
      setFormStatus(status);
      setHasUnsavedChanges(false);
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user.id);
      showSavedFeedback();
    }
    setIsUpdatingStatus(false);
    return success;
  }, [formId, user, performUpdateFormStatus, setFormStatus, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, setIsUpdatingStatus, showSavedFeedback]);

  const handleManualSaveDraft = useCallback(async () => {
    if (!formId || !user) return;
    setIsAutoSaving(true);
    const now = new Date().toISOString();
    const success = await performUpdateFormDetails(formId, formName, formDescription);
    if (success) {
      setLastSavedTimestamp(new Date(now));
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user.id);
      setHasUnsavedChanges(false);
      showSuccess("Form draft saved successfully!");
      showSavedFeedback();
    } else {
      showError("Failed to save draft. Please try again.");
    }
    setIsAutoSaving(false);
  }, [formId, formName, formDescription, user, performUpdateFormDetails, setIsAutoSaving, setLastSavedTimestamp, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, showSavedFeedback]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!formId || !state.newTemplateName.trim()) {
      showError("Template name cannot be empty.");
      return;
    }
    if (!user) {
      showError("You must be logged in to save a template.");
      return;
    }

    setIsSavingTemplate(true);
    const currentFormAsTemplateCopy: FormType = {
      id: formId,
      name: formName,
      description: formDescription,
      is_template: false, // This is the source form, not a template itself
      status: formStatus,
      user_id: user.id,
      created_at: state.formLastEditedAt || new Date().toISOString(), // Use existing or current
      updated_at: new Date().toISOString(),
      last_edited_by_user_id: user.id,
      last_edited_at: new Date().toISOString(),
    };

    const success = await performSaveAsTemplate(currentFormAsTemplateCopy, state.newTemplateName);

    if (success) {
      showSuccess("Form saved as template successfully!");
      setIsSaveAsTemplateDialogOpen(false);
      setNewTemplateName('');
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    } else {
      showError("Failed to save as template. Please try again.");
    }
    setIsSavingTemplate(false);
  }, [formId, formName, formDescription, formStatus, user, state.newTemplateName, state.formLastEditedAt, setIsSavingTemplate, performSaveAsTemplate, setIsSaveAsTemplateDialogOpen, setNewTemplateName, setFormLastEditedAt, setFormLastEditedByUserId, triggerAutoSave]);

  const handleOpenPreview = useCallback(() => {
    setIsFormPreviewOpen(true);
  }, [setIsFormPreviewOpen]);

  return {
    triggerAutoSave,
    handleAddSection,
    handleDeleteSection,
    handleSaveEditedSection, // Expose new handler
    handleAddField,
    handleDeleteField,
    handleToggleRequired,
    handleSaveLogic,
    handleSaveEditedField,
    handleUpdateFieldLabel,
    handlePublishUnpublish,
    handleManualSaveDraft,
    handleSaveAsTemplate,
    handleOpenPreview,
  };
};