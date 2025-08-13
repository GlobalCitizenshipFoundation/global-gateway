import { useCallback, useRef } from 'react';
import { useSession } from '@/contexts/auth/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { FormField, FormSection, DisplayRule } from '@/types';
import { useFormBuilderState } from '@/hooks/forms/useFormBuilderState';

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
        description: newSectionDescription || null,
        tooltip: newSectionTooltip || null,
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
      setNewSectionDescription('');
      setNewSectionTooltip('');
      setNewFieldSectionId(data.id);
      setHasUnsavedChanges(true);
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
    setIsAddingSection(false);
  }, [formId, newSectionName, newSectionDescription, newSectionTooltip, user, setSections, setNewSectionName, setNewSectionDescription, setNewSectionTooltip, setNewFieldSectionId, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, setIsAddingSection, triggerAutoSave]);

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    const { error } = await supabase.rpc('delete_form_section_with_field_handling', {
      p_section_id: sectionId,
      p_user_id: user?.id,
      p_field_action: 'uncategorize_fields', // Default action for this handler
      p_target_section_id: null,
    });
  
    if (error) {
      showError(`Failed to delete section: ${error.message}`);
    } else {
      showSuccess("Section deleted and fields moved to uncategorized successfully.");
      fetchData(); // Re-fetch to update the UI
    }
  }, [user, fetchData]);

  const handleAddField = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !formId || !user) return;

    setIsAddingField(true);
    let query = supabase
      .from('form_fields')
      .select('order')
      .eq('form_id', formId);
    
    // Conditionally apply section_id filter based on whether it's null
    if (newFieldSectionId === null) {
      query = query.is('section_id', null);
    } else {
      query = query.eq('section_id', newFieldSectionId);
    }

    const { data: currentFieldsInTargetSection, error: fetchError } = await query;

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
      setNewFieldDescription('');
      setNewFieldTooltip('');
      setNewFieldPlaceholder('');
      setHasUnsavedChanges(true);
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
    setIsAddingField(false);
  }, [formId, newFieldLabel, newFieldType, newFieldOptions, newFieldSectionId, newFieldDescription, newFieldTooltip, newFieldPlaceholder, user, setFields, setNewFieldLabel, setNewFieldOptions, setNewFieldType, setNewFieldDescription, setNewFieldTooltip, setNewFieldPlaceholder, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, setIsAddingField, triggerAutoSave]);

  const handleDeleteField = useCallback(async (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
    setHasUnsavedChanges(true);
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
    if (error) {
      showError(`Failed to delete field: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false);
    } else {
      showSuccess("Field deleted successfully.");
      const now = new Date().toISOString();
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user?.id || null);
      triggerAutoSave();
    }
  }, [setFields, fetchData, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, user, triggerAutoSave]);

  const handleToggleRequired = useCallback(async (fieldId: string, isRequired: boolean) => {
    if (!user) return;
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: isRequired } : f));
    setHasUnsavedChanges(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from('form_fields').update({ is_required: isRequired, last_edited_by_user_id: user.id, last_edited_at: now }).eq('id', fieldId);
    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: !isRequired } : f));
      setHasUnsavedChanges(false);
    } else {
      showSuccess("Field requirement updated.");
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [setFields, user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, triggerAutoSave]);

  const handleSaveLogic = useCallback(async (fieldId: string, rules: DisplayRule[]) => {
    if (!user) return;
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, display_rules: rules } : f))
    );
    setHasUnsavedChanges(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('form_fields')
      .update({ display_rules: rules, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to save display logic: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false);
    } else {
      showSuccess("Display logic saved successfully!");
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
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
    setHasUnsavedChanges(true);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('form_fields')
      .update({
        label: values.label,
        field_type: values.field_type,
        options: updatedOptions,
        is_required: values.is_required,
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
      setHasUnsavedChanges(false);
    } else {
      showSuccess("Field updated successfully!");
      fetchData();
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [setFields, user, fetchData, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, triggerAutoSave]);

  const handleUpdateFieldLabel = useCallback(async (fieldId: string, newLabel: string) => {
    if (!user) return;
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, label: newLabel } : f))
    );
    setHasUnsavedChanges(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('form_fields')
      .update({ label: newLabel, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update label: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false);
    } else {
      showSuccess("Field label updated.");
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
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
          description: section.description,
          tooltip: section.tooltip,
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
      setFormLastEditedAt(now);
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
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