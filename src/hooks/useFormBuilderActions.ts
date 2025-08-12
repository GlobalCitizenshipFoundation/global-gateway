import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection, DisplayRule } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

interface UseFormBuilderActionsProps {
  programId: string | undefined;
  setSections: React.Dispatch<React.SetStateAction<FormSection[]>>;
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  fetchData: () => Promise<void>; // To re-fetch data after certain operations
}

export const useFormBuilderActions = ({
  programId,
  setSections,
  setFields,
  fetchData,
}: UseFormBuilderActionsProps) => {

  const handleAddSection = async (name: string, currentSections: FormSection[]) => {
    if (!name.trim() || !programId) return null;

    const nextOrder = currentSections.length > 0 ? Math.max(...currentSections.map(s => s.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('form_sections')
      .insert({
        program_id: programId,
        name: name,
        order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add section: ${error.message}`);
      return null;
    } else {
      showSuccess("Section added successfully.");
      setSections(prev => [...prev, data]);
      return data; // Return the new section for immediate use (e.g., setting newFieldSectionId)
    }
  };

  const handleDeleteSection = async (sectionId: string, currentSections: FormSection[], currentFields: FormField[]) => {
    // Optimistically update local state first
    const originalSections = [...currentSections];
    const originalFields = [...currentFields];
    setSections(currentSections.filter(s => s.id !== sectionId));
    setFields(currentFields.map(f => f.section_id === sectionId ? { ...f, section_id: null } : f)); // Move fields to uncategorized

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
      section_id: null, // Set to null (uncategorized)
    }));

    const { error: updateFieldsError } = await supabase
      .from('form_fields')
      .upsert(updatesForFields); // Batch update fields to null section_id

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
      setFields(originalFields); // Revert fields too if section deletion fails
    } else {
      showSuccess("Section and its fields uncategorized successfully.");
      fetchData(); // Re-fetch to ensure full consistency
    }
  };

  const handleAddField = async (label: string, type: FormField['field_type'], options: string, sectionId: string | null, currentFields: FormField[]) => {
    if (!label.trim() || !programId) return null;

    const targetSectionFields = currentFields.filter(f => f.section_id === sectionId);
    const nextOrder = targetSectionFields.length > 0 ? Math.max(...targetSectionFields.map(f => f.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('form_fields')
      .insert({
        program_id: programId,
        label: label,
        field_type: type,
        order: nextOrder,
        section_id: sectionId,
        options: (type === 'select' || type === 'radio' || type === 'checkbox') ? options.split(',').map(opt => opt.trim()) : null,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add field: ${error.message}`);
      return null;
    } else if (data) {
      setFields(prev => [...prev, data as FormField]);
      showSuccess("Field added successfully.");
      return data as FormField;
    }
    return null;
  };

  const handleDeleteField = async (fieldId: string) => {
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
    if (error) {
      showError(`Failed to delete field: ${error.message}`);
    } else {
      setFields(prev => prev.filter(f => f.id !== fieldId));
      showSuccess("Field deleted successfully.");
    }
  };

  const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: isRequired } : f));
    const { error } = await supabase.from('form_fields').update({ is_required: isRequired }).eq('id', fieldId);
    if (error) {
      showError(`Failed to update field: ${error.message}`);
      setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: !isRequired } : f));
    }
  };

  const handleSaveLogic = async (fieldId: string, rules: DisplayRule[]) => {
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, display_rules: rules } : f))
    );
    const { error } = await supabase
      .from('form_fields')
      .update({ display_rules: rules })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to save display logic: ${error.message}`);
    } else {
      showSuccess("Display logic saved successfully!");
    }
  };

  const handleSaveEditedField = async (fieldId: string, values: { label: string; field_type: FormField['field_type']; options?: string; is_required: boolean; }) => {
    const updatedOptions = (values.field_type === 'select' || values.field_type === 'radio' || values.field_type === 'checkbox')
      ? values.options?.split(',').map(opt => opt.trim()) || null
      : null;

    setFields(prevFields =>
      prevFields.map(f =>
        f.id === fieldId
          ? { ...f, label: values.label, field_type: values.field_type, options: updatedOptions, is_required: values.is_required }
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
      })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update field: ${error.message}`);
    } else {
      showSuccess("Field updated successfully!");
    }
  };

  return {
    handleAddSection,
    handleDeleteSection,
    handleAddField,
    handleDeleteField,
    handleToggleRequired,
    handleSaveLogic,
    handleSaveEditedField,
  };
};