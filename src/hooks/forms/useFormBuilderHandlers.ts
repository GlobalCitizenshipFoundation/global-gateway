import { useCallback, useRef } from 'react';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { FormField, DisplayRule, Form as FormType } from '@/types';
import { useFormBuilderState } from '@/hooks/forms/useFormBuilderState';
import { useFormBuilderActions } from '@/hooks/forms/useFormBuilderActions';
import { supabase } from '@/integrations/supabase/client';

interface UseFormBuilderHandlersProps {
  state: ReturnType<typeof useFormBuilderState>;
}

const AUTO_SAVE_DEBOUNCE_TIME = 2000; // 2 seconds
const SAVED_CONFIRMATION_DISPLAY_TIME = 2000; // 2 seconds

export const useFormBuilderHandlers = ({
  state: {
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
  },
}: UseFormBuilderHandlersProps) => {
  const { user } = useSession();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedConfirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    handleAddSection: performAddSection,
    handleDeleteSection: performDeleteSection,
    handleSaveEditedSection: performSaveEditedSection,
    handleSaveSectionLogic: performSaveSectionLogic,
    handleAddField: performAddField,
    handleDeleteField: performDeleteField,
    handleToggleRequired: performToggleRequired,
    handleSaveLogic: performSaveLogic,
    handleSaveEditedField: performSaveEditedField,
    handleUpdateFieldLabel: performUpdateFieldLabel,
    handleUpdateFormStatus: performUpdateFormStatus,
    handleUpdateFormDetails: performUpdateFormDetails,
    handleSaveAsTemplate: performSaveAsTemplate,
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

  const handleSaveEditedSection = useCallback(async (sectionId: string, values: { name: string; description?: string | null; tooltip?: string | null; }) => {
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

  const handleSaveSectionLogic = useCallback(async (sectionId: string, rules: DisplayRule[], logicType: 'AND' | 'OR') => {
    if (!user) return;
    const success = await performSaveSectionLogic(sectionId, rules, logicType);
    if (success) {
      showSuccess("Section display logic saved successfully!");
      setHasUnsavedChanges(true);
      setFormLastEditedAt(new Date().toISOString());
      setFormLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [user, setHasUnsavedChanges, setFormLastEditedAt, setFormLastEditedByUserId, performSaveSectionLogic, triggerAutoSave]);

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

  const handleSaveLogic = useCallback(async (fieldId: string, rules: DisplayRule[], logicType: 'AND' | 'OR') => {
    if (!user) return false;
    
    const { error } = await supabase
      .from('form_fields')
      .update({ display_rules: rules, display_rules_logic_type: logicType, last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to save display logic: ${error.message}.`);
      fetchData(); // Re-fetch on error
      return false;
    } else {
      fetchData(); // Re-fetch on success to ensure UI consistency
      return true;
    }
  }, [user, fetchData]);

  const handleSaveEditedField = useCallback(async (fieldId: string, values: {
    label: string;
    field_type: FormField['field_type'];
    options?: string;
    is_required: boolean;
    is_anonymized: boolean;
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
    if (!user) return false;
    const updatedOptions = (values.field_type === 'select' || values.field_type === 'radio' || values.field_type === 'checkbox')
      ? values.options?.split(',').map(opt => opt.trim()) || null
      : null;

    const updatePayload: Partial<FormField> = {
      label: values.label,
      field_type: values.field_type,
      options: updatedOptions,
      is_required: values.is_required,
      is_anonymized: values.is_anonymized,
      description: values.description || null,
      tooltip: values.tooltip || null,
      placeholder: values.placeholder || null,
      section_id: values.section_id === 'none' ? null : values.section_id || null,
      last_edited_by_user_id: user.id,
      last_edited_at: new Date().toISOString(),
    };

    if (values.field_type === 'date') {
      updatePayload.date_min = values.date_min || null;
      updatePayload.date_max = values.date_max || null;
      updatePayload.date_allow_past = values.date_allow_past ?? true;
      updatePayload.date_allow_future = values.date_allow_future ?? true;
    } else {
      updatePayload.date_min = null;
      updatePayload.date_max = null;
      updatePayload.date_allow_past = true;
      updatePayload.date_allow_future = true;
    }

    if (values.field_type === 'rating') {
      updatePayload.rating_min_value = values.rating_min_value ?? 1;
      updatePayload.rating_max_value = values.rating_max_value ?? 5;
      updatePayload.rating_min_label = values.rating_min_label || "Poor";
      updatePayload.rating_max_label = values.rating_max_label || "Excellent";
    } else {
      updatePayload.rating_min_value = null;
      updatePayload.rating_max_value = null;
      updatePayload.rating_min_label = null;
      updatePayload.rating_max_label = null;
    }

    const { error } = await supabase
      .from('form_fields')
      .update(updatePayload)
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update field: ${error.message}.`);
      fetchData();
      return false;
    } else {
      fetchData(); // Re-fetch on success to ensure UI consistency
      return true;
    }
  }, [user, fetchData]);

  const handleUpdateFieldLabel = async (fieldId: string, newLabel: string) => {
    if (!user) return false;
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, label: newLabel } : f))
    );
    const { error } = await supabase
      .from('form_fields')
      .update({ label: newLabel, last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update label: ${error.message}. Reverting.`);
      fetchData();
      return false;
    } else {
      return true;
    }
  };

  const handleUpdateFormStatus = async (id: string, status: 'draft' | 'published') => {
    if (!user) return false;
    const { error } = await supabase
      .from('forms')
      .update({ status: status, updated_at: new Date().toISOString(), last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      showError(`Failed to update form status: ${error.message}`);
      return false;
    } else {
      return true;
    }
  };

  const handleUpdateFormDetails = async (id: string, name: string, description: string | null) => {
    if (!user) return false;
    const { error } = await supabase
      .from('forms')
      .update({ name: name, description: description, updated_at: new Date().toISOString(), last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return false;
    } else {
      return true;
    }
  };

  const handleSaveAsTemplate = async (templateFormToCopy: FormType, newTemplateName: string) => {
    if (!templateFormToCopy || !newTemplateName.trim()) {
      showError("Template name cannot be empty.");
      return false;
    }
    if (!user) {
      showError("You must be logged in to save a template.");
      return false;
    }

    try {
      const now = new Date().toISOString();
      const { data: newTemplateFormData, error: newTemplateFormError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: newTemplateName,
        is_template: true,
        status: 'published',
        description: templateFormToCopy.description,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      }).select('id').single();

      if (newTemplateFormError || !newTemplateFormData) {
        showError(`Failed to create template form: ${newTemplateFormError?.message}`);
        return false;
      }

      const { data: currentSections, error: sectionsError } = await supabase
        .from('form_sections')
        .select('*')
        .eq('form_id', templateFormToCopy.id)
        .order('order', { ascending: true });

      const { data: currentFields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', templateFormToCopy.id)
        .order('order', { ascending: true });

      if (sectionsError || fieldsError) {
        showError(`Failed to load current form content: ${sectionsError?.message || fieldsError?.message}`);
        await supabase.from('forms').delete().eq('id', newTemplateFormData.id);
        return false;
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
          display_rules: section.display_rules, // Copy display rules
          display_rules_logic_type: section.display_rules_logic_type, // Copy logic type
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
        is_anonymized: field.is_anonymized,
        order: field.order,
        display_rules: field.display_rules,
        display_rules_logic_type: field.display_rules_logic_type,
        description: field.description,
        tooltip: field.tooltip,
        placeholder: field.placeholder,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
        date_min: field.date_min,
        date_max: field.date_max,
        date_allow_past: field.date_allow_past,
        date_allow_future: field.date_allow_future,
        rating_min_value: field.rating_min_value,
        rating_max_value: field.rating_max_value,
        rating_min_label: field.rating_min_label,
        rating_max_label: field.rating_max_label,
      }));

      const { error: insertSectionsError } = await supabase.from('form_sections').insert(newSectionsToInsert);
      const { error: insertFieldsError } = await supabase.from('form_fields').insert(newFieldsToInsert);

      if (insertSectionsError || insertFieldsError) {
        showError(`Failed to copy form content to template: ${insertSectionsError?.message || insertFieldsError?.message}`);
        await supabase.from('forms').delete().eq('id', newTemplateFormData.id);
        return false;
      }

      return true;
    } catch (err: any) {
      showError("An unexpected error occurred: " + err.message);
      return false;
    }
  };

  return {
    handleAddSection,
    handleDeleteSection,
    handleSaveEditedSection,
    handleSaveSectionLogic,
    handleAddField,
    handleDeleteField,
    handleToggleRequired,
    handleSaveLogic,
    handleSaveEditedField,
    handleUpdateFieldLabel,
    handleUpdateFormStatus,
    handleUpdateFormDetails,
    handleSaveAsTemplate,
  };
};