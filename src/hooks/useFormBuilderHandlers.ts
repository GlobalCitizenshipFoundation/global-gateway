import { useCallback, useRef } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { FormField, FormSection, DisplayRule } from '@/types';
import { useFormBuilderState } from './useFormBuilderState'; // Import the state hook

interface UseFormBuilderHandlersProps {
  state: ReturnType<typeof useFormBuilderState>;
  performUpdateFormDetails: (id: string, name: string, description: string | null) => Promise<boolean>;
  performUpdateFormStatus: (id: string, status: 'draft' | 'published') => Promise<boolean>;
}

const AUTO_SAVE_DEBOUNCE_TIME = 2000; // 2 seconds

export const useFormBuilderHandlers = ({
  state,
  performUpdateFormDetails,
  performUpdateFormStatus,
}: UseFormBuilderHandlersProps) => {
  const { user } = useSession();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    setIsLogicBuilderOpen,
    setFieldToEditLogic,
    setIsEditFieldDialogOpen,
    setFieldToEditDetails,
    setIsSaveAsTemplateDialogOpen,
    setNewTemplateName,
    setIsSavingTemplate,
    setIsFormPreviewOpen,
    newSectionName, setNewSectionName,
    isAddingSection, setIsAddingSection,
    newFieldLabel, setNewFieldLabel,
    newFieldType, setNewFieldType,
    newFieldOptions, setNewFieldOptions,
    newFieldSectionId, setNewFieldSectionId,
    newFieldHelpText, setNewFieldHelpText,
    newFieldDescription, setNewFieldDescription,
    newFieldTooltip, setNewFieldTooltip,
    newFieldPlaceholder, setNewFieldPlaceholder,
    isAddingField, setIsAddingField,
  } = state;

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setHasUnsavedChanges(true);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!formId) return;
      setIsAutoSaving(true);
      const success = await performUpdateFormDetails(formId, formName, formDescription);
      if (success) {
        setLastSavedTimestamp(new Date());
        setHasUnsavedChanges(false);
      } else {
        showError("Auto-save failed. Please check your connection.");
      }
      setIsAutoSaving(false);
    }, AUTO_SAVE_DEBOUNCE_TIME);
  }, [formId, formName, formDescription, performUpdateFormDetails, setIsAutoSaving, setLastSavedTimestamp, setHasUnsavedChanges]);

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

    const { data, error } = await supabase
      .from('form_sections')
      .insert({
        form_id: formId,
        name: newSectionName,
        order: nextOrder,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add section: ${error.message}`);
    } else {
      showSuccess("Section added successfully.");
      setSections(prev => [...prev, data]);
      setNewSectionName('');
      setNewFieldSectionId(data.id);
      setHasUnsavedChanges(true);
    }
    setIsAddingSection(false);
  }, [formId, newSectionName, user, setSections, setNewSectionName, setNewFieldSectionId, setHasUnsavedChanges, setIsAddingSection]);

  const handleDeleteSection = useCallback(async (sectionId: string) => {
    const originalSections = [...sections];
    const originalFields = [...fields];
    setSections(sections.filter(s => s.id !== sectionId));
    setFields(fields.map(f => f.section_id === sectionId ? { ...f, section_id: null } : f));

    const { data: fieldsToUpdate, error: fetchFieldsError } = await supabase
      .from('form_fields')
      .select('id')
      .eq('section_id', sectionId);

    if (fetchFieldsError) {
      showError(`Failed to fetch fields for section deletion: ${fetchFieldsError.message}. Reverting.`);
      setSections(originalSections);
      setFields(originalFields);
      return;
    }

    const updatesForFields = fieldsToUpdate.map(field => ({
      id: field.id,
      section_id: null,
      last_edited_by_user_id: user?.id || null,
      last_edited_at: new Date().toISOString(),
    }));

    const { error: updateFieldsError } = await supabase
      .from('form_fields')
      .upsert(updatesForFields);

    if (updateFieldsError) {
      showError(`Failed to uncategorize fields: ${updateFieldsError.message}. Reverting.`);
      setSections(originalSections);
      setFields(originalFields);
      return;
    }

    const { error: deleteSectionError } = await supabase.from('form_sections').delete().eq('id', sectionId);
    if (deleteSectionError) {
      showError(`Failed to delete section: ${deleteSectionError.message}. Reverting.`);
      setSections(originalSections);
      setFields(originalFields);
    } else {
      showSuccess("Section and its fields uncategorized successfully.");
      fetchData();
      setHasUnsavedChanges(true);
    }
  }, [sections, fields, setSections, setFields, user, fetchData, setHasUnsavedChanges]);

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
        help_text: newFieldHelpText || null,
        description: newFieldDescription || null,
        tooltip: newFieldTooltip || null,
        placeholder: newFieldPlaceholder || null,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
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
      setNewFieldHelpText('');
      setNewFieldDescription('');
      setNewFieldTooltip('');
      setNewFieldPlaceholder('');
      setHasUnsavedChanges(true);
    }
    setIsAddingField(false);
  }, [formId, newFieldLabel, newFieldType, newFieldOptions, newFieldSectionId, newFieldHelpText, newFieldDescription, newFieldTooltip, newFieldPlaceholder, user, setFields, setNewFieldLabel, setNewFieldOptions, setNewFieldType, setNewFieldHelpText, setNewFieldDescription, setNewFieldTooltip, setNewFieldPlaceholder, setHasUnsavedChanges, setIsAddingField]);

  const handleDeleteField = useCallback(async (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
    if (error) {
      showError(`Failed to delete field: ${error.message}. Reverting.`);
      fetchData();
    } else {
      showSuccess("Field deleted successfully.");
      setHasUnsavedChanges(true);
    }
  }, [setFields, fetchData, setHasUnsavedChanges]);

  const handleToggleRequired = useCallback(async (fieldId: string, isRequired: boolean) => {
    if (!user) return;
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: isRequired } : f));
    const { error } = await supabase.from('form_fields').update({ is_required: isRequired, last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() }).eq('id', fieldId);
    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: !isRequired } : f));
    } else {
      showSuccess("Field requirement updated.");
      setHasUnsavedChanges(true);
    }
  }, [setFields, user, setHasUnsavedChanges]);

  const handleEditLogic = useCallback((field: FormField) => {
    setFieldToEditLogic(field);
    setIsLogicBuilderOpen(true);
  }, [setFieldToEditLogic, setIsLogicBuilderOpen]);

  const handleSaveLogic = useCallback(async (fieldId: string, rules: DisplayRule[]) => {
    if (!user) return;
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, display_rules: rules } : f))
    );
    const { error } = await supabase
      .from('form_fields')
      .update({ display_rules: rules, last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to save display logic: ${error.message}. Reverting.`);
      fetchData();
    } else {
      showSuccess("Display logic saved successfully!");
      setHasUnsavedChanges(true);
    }
  }, [setFields, user, fetchData, setHasUnsavedChanges]);

  const handleEditField = useCallback((field: FormField) => {
    setFieldToEditDetails(field);
    setIsEditFieldDialogOpen(true);
  }, [setFieldToEditDetails, setIsEditFieldDialogOpen]);

  const handleSaveEditedField = useCallback(async (fieldId: string, values: { label: string; field_type: FormField['field_type']; options?: string; is_required: boolean; help_text?: string | null; description?: string | null; tooltip?: string | null; placeholder?: string | null; section_id?: string | null; }) => {
    if (!user) return;
    const updatedOptions = (values.field_type === 'select' || values.field_type === 'radio' || values.field_type === 'checkbox')
      ? values.options?.split(',').map(opt => opt.trim()) || null
      : null;

    setFields(prevFields =>
      prevFields.map(f =>
        f.id === fieldId
          ? { ...f, label: values.label, field_type: values.field_type, options: updatedOptions, is_required: values.is_required, help_text: values.help_text || null, description: values.description || null, tooltip: values.tooltip || null, placeholder: values.placeholder || null, section_id: values.section_id === 'none' ? null : values.section_id }
          : f
      )
    );

    const { error } = await supabase
      .from('form_fields')
      .update({
        label: values.label,
        field_type: values.field_type,
        options: updatedOptions,
        is_required: values.is_required,
        help_text: values.help_text || null,
        description: values.description || null,
        tooltip: values.tooltip || null,
        placeholder: values.placeholder || null,
        section_id: values.section_id === 'none' ? null : values.section_id,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      fetchData();
    } else {
      showSuccess("Field updated successfully!");
      fetchData();
      setHasUnsavedChanges(true);
    }
    setIsEditFieldDialogOpen(false);
    setFieldToEditDetails(null);
  }, [setFields, user, fetchData, setHasUnsavedChanges, setIsEditFieldDialogOpen, setFieldToEditDetails]);

  const handleUpdateFieldLabel = useCallback(async (fieldId: string, newLabel: string) => {
    if (!user) return;
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
    } else {
      showSuccess("Field label updated.");
      setHasUnsavedChanges(true);
    }
  }, [setFields, user, fetchData, setHasUnsavedChanges]);

  const handlePublishUnpublish = useCallback(async (status: 'draft' | 'published') => {
    if (!formId) return;
    setIsUpdatingStatus(true);
    const success = await performUpdateFormStatus(formId, status);
    if (success) {
      setFormStatus(status);
      setHasUnsavedChanges(false);
    }
    setIsUpdatingStatus(false);
  }, [formId, performUpdateFormStatus, setFormStatus, setHasUnsavedChanges, setIsUpdatingStatus]);

  const handleManualSaveDraft = useCallback(async () => {
    if (!formId) return;
    setIsAutoSaving(true);
    const success = await performUpdateFormDetails(formId, formName, formDescription);
    if (success) {
      setLastSavedTimestamp(new Date());
      setHasUnsavedChanges(false);
      showSuccess("Form draft saved successfully!");
    } else {
      showError("Failed to save draft. Please try again.");
    }
    setIsAutoSaving(false);
  }, [formId, formName, formDescription, performUpdateFormDetails, setIsAutoSaving, setLastSavedTimestamp, setHasUnsavedChanges]);

  const handleSaveAsTemplate = useCallback(async () => {
    if (!formId || !state.newTemplateName.trim()) { // Fixed: Use state.newTemplateName
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

      const { data: newTemplateFormData, error: newTemplateFormError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: state.newTemplateName, // Fixed: Use state.newTemplateName
        is_template: true,
        status: 'published',
        description: currentFormData.description,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
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
          last_edited_by_user_id: user.id,
          last_edited_at: new Date().toISOString(),
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
        help_text: field.help_text,
        description: field.description,
        tooltip: field.tooltip,
        placeholder: field.placeholder,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
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
    } catch (err: any) {
      showError("An unexpected error occurred: " + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  }, [formId, state.newTemplateName, user, setIsSavingTemplate, setIsSaveAsTemplateDialogOpen, setNewTemplateName]); // Fixed: Use state.newTemplateName in dependency array

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
    handleEditLogic,
    handleSaveLogic,
    handleEditField,
    handleSaveEditedField,
    handleUpdateFieldLabel,
    handlePublishUnpublish,
    handleManualSaveDraft,
    handleSaveAsTemplate,
    handleOpenPreview,
  };
};