import { useCallback, useRef } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { FormField, FormSection, DisplayRule } from '@/types';
import { useFormBuilderState } from './useFormBuilderState';

interface UseFormBuilderHandlersProps {
  state: ReturnType<typeof useFormBuilderState>;
  performUpdateFormDetails: (id: string, name: string, description: string | null) => Promise<boolean>;
  performUpdateFormStatus: (id: string, status: 'draft' | 'published') => Promise<boolean>;
}

const AUTO_SAVE_DEBOUNCE_TIME = 2000; // 2 seconds
const SAVED_CONFIRMATION_DISPLAY_TIME = 2000; // 2 seconds

export const useFormBuilderHandlers = ({
  state,
  performUpdateFormDetails,
  performUpdateFormStatus,
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
    newSectionDescription, setNewSectionDescription, // New
    newSectionTooltip, setNewSectionTooltip, // New
    isAddingSection, setIsAddingSection,
    newFieldLabel, setNewFieldLabel,
    newFieldType, setNewFieldType,
    newFieldOptions, setNewFieldOptions,
    newFieldSectionId, setNewFieldSectionId,
    // Removed newFieldHelpText
    newFieldDescription, setNewFieldDescription,
    newFieldTooltip, setNewFieldTooltip,
    newFieldPlaceholder, setNewFieldPlaceholder,
    isAddingField, setIsAddingField,
  } = state;

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
    setHasUnsavedChanges(true); // Indicate unsaved changes immediately
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!formId || !user) return; // Ensure user is logged in for auto-save

      setIsAutoSaving(true);
      const now = new Date().toISOString();
      const success = await performUpdateFormDetails(formId, formName, formDescription);
      
      if (success) {
        setLastSavedTimestamp(new Date(now));
        setFormLastEditedAt(now);
        setFormLastEditedByUserId(user.id);
        setHasUnsavedChanges(false);
        showSavedFeedback(); // Show "Saved!" confirmation
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
    const { data: currentSections, error: fetchError } = await supabase
      .from('form_sections')
      .select('order')
      .eq('form_id', formId);

    if (fetchError) {
      showError(`Failed to fetch sections for new order: ${fetchError.message}`);
      setIsAddingSection(false);
      return;
    }

    const nextOrder = currentSections && currentSections.length > 0 ? Math.max(...currentSections.map(s => s.order)) + 1 : 1;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('form_sections')
      .insert({
        form_id: formId,
        name: newSectionName,
        order: nextOrder,
        description: newSectionDescription || null, // New
        tooltip: newSectionTooltip || null, // New
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add section: ${error.message}`);
    } else {
      showSuccess("Section added successfully.");
      setSections(prev => [...prev, data]);
      setNewSectionName('');
      setNewSectionDescription(''); // Reset
      setNewSectionTooltip(''); // Reset
      setNewFieldSectionId(data.id);
      setHasUnsavedChanges(true); // Mark as unsaved
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user.id); // Update form's last edited user
      triggerAutoSave(); // Trigger auto-save for form details
    }
    setIsAddingSection(false);
  }, [formId, newSectionName, newSectionDescription, newSectionTooltip, user, setSections, setNewSectionName, setNewSectionDescription, setNewSectionTooltip, setNewFieldSectionId, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, setIsAddingSection, triggerAutoSave]);

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    const originalSections = [...sections];
    const originalFields = [...fields];
    setSections(sections.filter(s => s.id !== sectionId));
    setFields(fields.map(f => f.section_id === sectionId ? { ...f, section_id: null } : f));
    setHasUnsavedChanges(true); // Mark as unsaved

    const { data: fieldsToUpdate, error: fetchFieldsError } = await supabase
      .from('form_fields')
      .select('id')
      .eq('section_id', sectionId);

    if (fetchFieldsError) {
      showError(`Failed to fetch fields for section deletion: ${fetchFieldsError.message}. Reverting.`);
      setSections(originalSections);
      setFields(originalFields);
      setHasUnsavedChanges(false); // Revert unsaved status
      return;
    }

    const now = new Date().toISOString();
    const updatesForFields = fieldsToUpdate.map(field => ({
      id: field.id,
      section_id: null,
      last_edited_by_user_id: user?.id || null,
      last_edited_at: now,
    }));

    const { error: updateFieldsError } = await supabase
      .from('form_fields')
      .upsert(updatesForFields);

    if (updateFieldsError) {
      showError(`Failed to uncategorize fields: ${updateFieldsError.message}. Reverting.`);
      setSections(originalSections);
      setFields(originalFields);
      setHasUnsavedChanges(false); // Revert unsaved status
      return;
    }

    const { error: deleteSectionError } = await supabase.from('form_sections').delete().eq('id', sectionId);
    if (deleteSectionError) {
      showError(`Failed to delete section: ${deleteSectionError.message}. Reverting.`);
      setSections(originalSections);
      setFields(originalFields);
      setHasUnsavedChanges(false); // Revert unsaved status
    } else {
      showSuccess("Section and its fields uncategorized successfully.");
      fetchData(); // Re-fetch to ensure full consistency after all operations
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user?.id || null); // Update form's last edited user
      triggerAutoSave(); // Trigger auto-save for form details
    }
  }, [sections, fields, setSections, setFields, user, fetchData, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, triggerAutoSave]);

  const handleAddField = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !formId || !user) return;

    setIsAddingField(true);
    const { data: currentFieldsInTargetSection, error: fetchError } = await supabase
      .from('form_fields')
      .select('order')
      .eq('form_id', formId)
      .eq('section_id', newFieldSectionId);

    if (fetchError) {
      showError(`Failed to fetch fields for new order: ${fetchError.message}`);
      setIsAddingField(false);
      return;
    }

    const nextOrder = currentFieldsInTargetSection && currentFieldsInTargetSection.length > 0 ? Math.max(...currentFieldsInTargetSection.map(f => f.order)) + 1 : 1;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('form_fields')
      .insert({
        form_id: formId,
        label: newFieldLabel,
        field_type: newFieldType,
        order: nextOrder,
        section_id: newFieldSectionId,
        options: (newFieldType === 'select' || newFieldType === 'radio' || newFieldType === 'checkbox') ? newFieldOptions.split(',').map(opt => opt.trim()) : null,
        is_required: false,
        display_rules: null,
        // Removed help_text
        description: newFieldDescription || null,
        tooltip: newFieldTooltip || null,
        placeholder: newFieldPlaceholder || null,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add field: ${error.message}`);
    } else if (data) {
      setFields(prev => [...prev, data as FormField]);
      showSuccess("Field added successfully.");
      setNewFieldLabel('');
      setNewFieldOptions('');
      setNewFieldType('text');
      // Removed setNewFieldHelpText
      setNewFieldDescription('');
      setNewFieldTooltip('');
      setNewFieldPlaceholder('');
      setHasUnsavedChanges(true); // Mark as unsaved
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user.id); // Update form's last edited user
      triggerAutoSave(); // Trigger auto-save for form details
    }
    setIsAddingField(false);
  }, [formId, newFieldLabel, newFieldType, newFieldOptions, newFieldSectionId, newFieldDescription, newFieldTooltip, newFieldPlaceholder, user, setFields, setNewFieldLabel, setNewFieldOptions, setNewFieldType, setNewFieldDescription, setNewFieldTooltip, setNewFieldPlaceholder, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, setIsAddingField, triggerAutoSave]);

  const handleDeleteField = useCallback(async (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
    setHasUnsavedChanges(true); // Mark as unsaved
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
    if (error) {
      showError(`Failed to delete field: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false); // Revert unsaved status
    } else {
      showSuccess("Field deleted successfully.");
      const now = new Date().toISOString();
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user?.id || null); // Update form's last edited user
      triggerAutoSave(); // Trigger auto-save for form details
    }
  }, [setFields, fetchData, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, user, triggerAutoSave]);

  const handleToggleRequired = useCallback(async (fieldId: string, isRequired: boolean) => {
    if (!user) return;
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: isRequired } : f));
    setHasUnsavedChanges(true); // Mark as unsaved
    const now = new Date().toISOString();
    const { error } = await supabase.from('form_fields').update({ is_required: isRequired, last_edited_by_user_id: user.id, last_edited_at: now }).eq('id', fieldId);
    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: !isRequired } : f)); // Revert
      setHasUnsavedChanges(false); // Revert unsaved status
    } else {
      showSuccess("Field requirement updated.");
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user.id); // Update form's last edited user
      triggerAutoSave(); // Trigger auto-save for form details
    }
  }, [setFields, user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, triggerAutoSave]);

  // handleEditLogic and handleEditField are now replaced by setSelectedField in FormBuilderPage
  // The logic for saving is now handled by handleSaveEditedField and handleSaveLogic directly from FieldPropertiesPanel

  const handleSaveLogic = useCallback(async (fieldId: string, rules: DisplayRule[]) => {
    if (!user) return;
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, display_rules: rules } : f))
    );
    setHasUnsavedChanges(true); // Mark as unsaved
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('form_fields')
      .update({ display_rules: rules, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to save display logic: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false); // Revert unsaved status
    } else {
      showSuccess("Display logic saved successfully!");
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user.id); // Update form's last edited user
      triggerAutoSave(); // Trigger auto-save for form details
    }
  }, [setFields, user, fetchData, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, triggerAutoSave]);

  const handleSaveEditedField = useCallback(async (fieldId: string, values: { label: string; field_type: FormField['field_type']; options?: string; is_required: boolean; description?: string | null; tooltip?: string | null; placeholder?: string | null; section_id?: string | null; }) => {
    if (!user) return;
    const updatedOptions = (values.field_type === 'select' || values.field_type === 'radio' || values.field_type === 'checkbox')
      ? values.options?.split(',').map(opt => opt.trim()) || null
      : null;

    setFields(prevFields =>
      prevFields.map(f =>
        f.id === fieldId
          ? { ...f, label: values.label, field_type: values.field_type, options: updatedOptions, is_required: values.is_required, description: values.description || null, tooltip: values.tooltip || null, placeholder: values.placeholder || null, section_id: values.section_id === 'none' ? null : values.section_id }
          : f
      )
    );
    setHasUnsavedChanges(true); // Mark as unsaved
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('form_fields')
      .update({
        label: values.label,
        field_type: values.field_type,
        options: updatedOptions,
        is_required: values.is_required,
        // Removed help_text
        description: values.description || null,
        tooltip: values.tooltip || null,
        placeholder: values.placeholder || null,
        section_id: values.section_id === 'none' ? null : values.section_id,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false); // Revert unsaved status
    } else {
      showSuccess("Field updated successfully!");
      fetchData(); // Re-fetch to ensure correct order and section display after update
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user.id); // Update form's last edited user
      triggerAutoSave(); // Trigger auto-save for form details
    }
  }, [setFields, user, fetchData, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, triggerAutoSave]);

  const handleUpdateFieldLabel = useCallback(async (fieldId: string, newLabel: string) => {
    if (!user) return;
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, label: newLabel } : f))
    );
    setHasUnsavedChanges(true); // Mark as unsaved
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('form_fields')
      .update({ label: newLabel, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update label: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false); // Revert unsaved status
    } else {
      showSuccess("Field label updated.");
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user.id); // Update form's last edited user
      triggerAutoSave(); // Trigger auto-save for form details
    }
  }, [setFields, user, fetchData, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, triggerAutoSave]);

  const handlePublishUnpublish = useCallback(async (status: 'draft' | 'published') => {
    if (!formId || !user) return false;
    setIsUpdatingStatus(true);
    const now = new Date().toISOString();
    const success = await performUpdateFormStatus(formId, status);
    if (success) {
      setFormStatus(status);
      setHasUnsavedChanges(false);
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user.id); // Update form's last edited user
      showSavedFeedback(); // Show "Saved!" confirmation
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
      showSavedFeedback(); // Show "Saved!" confirmation
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

    try {
      const { data: currentFormData, error: fetchFormError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (fetchFormError || !currentFormData) {
        showError(`Failed to fetch current form details: ${fetchFormError?.message}`);
        return;
      }

      const { data: currentSections, error: sectionsError } = await supabase
        .from('form_sections')
        .select('*')
        .eq('form_id', formId)
        .order('order', { ascending: true });

      const { data: currentFields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('order', { ascending: true });

      if (sectionsError || fieldsError) {
        showError(`Failed to load current form content: ${sectionsError?.message || fieldsError?.message}`);
        return;
      }

      const now = new Date().toISOString();
      const { data: newTemplateFormData, error: newTemplateFormError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: state.newTemplateName,
        is_template: true,
        status: 'published',
        description: currentFormData.description,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      }).select('id').single();

      if (newTemplateFormError || !newTemplateFormData) {
        showError(`Failed to create template form: ${newTemplateFormError?.message}`);
        return;
      }

      const oldSectionIdMap = new Map<string, string>();
      const newSectionsToInsert = currentSections.map(section => {
        const newSectionId = crypto.randomUUID();
        oldSectionIdMap.set(section.id, newSectionId);
        return {
          id: newSectionId,
          form_id: newTemplateFormData.id,
          name: section.name,
          order: section.order,
          description: section.description, // Copy section description
          tooltip: section.tooltip, // Copy section tooltip
          last_edited_by_user_id: user.id,
          last_edited_at: now,
        };
      });

      const newFieldsToInsert = currentFields.map(field => ({
        id: crypto.randomUUID(),
        form_id: newTemplateFormData.id,
        section_id: field.section_id ? oldSectionIdMap.get(field.section_id) : null,
        label: field.label,
        field_type: field.field_type,
        options: field.options,
        is_required: field.is_required,
        order: field.order,
        display_rules: field.display_rules,
        // Removed help_text
        description: field.description,
        tooltip: field.tooltip,
        placeholder: field.placeholder,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      }));

      const { error: insertSectionsError } = await supabase.from('form_sections').insert(newSectionsToInsert);
      const { error: insertFieldsError } = await supabase.from('form_fields').insert(newFieldsToInsert);

      if (insertSectionsError || insertFieldsError) {
        showError(`Failed to copy form content to template: ${insertSectionsError?.message || insertFieldsError?.message}`);
        await supabase.from('forms').delete().eq('id', newTemplateFormData.id);
        return;
      }

      showSuccess("Form saved as template successfully!");
      setIsSaveAsTemplateDialogOpen(false);
      setNewTemplateName('');
      setFormLastEditedAt(now); // Update form's last edited timestamp
      setFormLastEditedByUserId(user.id); // Update form's last edited user
      triggerAutoSave(); // Trigger auto-save for form details
    } catch (err: any) {
      showError("An unexpected error occurred: " + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  }, [formId, state.newTemplateName, user, setIsSavingTemplate, setIsSaveAsTemplateDialogOpen, setNewTemplateName, setFormLastEditedAt, setFormLastEditedByUserId, triggerAutoSave]);

  const handleOpenPreview = useCallback(() => {
    setIsFormPreviewOpen(true);
  }, [setIsFormPreviewOpen]);

  return {
    triggerAutoSave,
    handleAddSection,
    handleDeleteSection,
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