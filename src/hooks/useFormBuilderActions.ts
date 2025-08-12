import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection, DisplayRule } from '@/types';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext'; // Import useSession

interface UseFormBuilderActionsProps {
  formId: string | undefined; // Changed from programId
  setSections: React.Dispatch<React.SetStateAction<FormSection[]>>;
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  fetchData: () => Promise<void>; // To re-fetch data after certain operations
}

export const useFormBuilderActions = ({
  formId, // Changed from programId
  setSections,
  setFields,
  fetchData,
}: UseFormBuilderActionsProps) => {
  const { user } = useSession(); // Get current user

  const handleAddSection = async (name: string) => {
    if (!name.trim() || !formId || !user) return null; // Use formId and user

    // Fetch current sections to determine next order
    const { data: currentSections, error: fetchError } = await supabase
      .from('form_sections')
      .select('order')
      .eq('form_id', formId); // Use formId

    if (fetchError) {
      showError(`Failed to fetch sections for new order: ${fetchError.message}`);
      return null;
    }

    const nextOrder = currentSections && currentSections.length > 0 ? Math.max(...currentSections.map(s => s.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('form_sections')
      .insert({
        form_id: formId, // Use formId
        name: name,
        order: nextOrder,
        last_edited_by_user_id: user.id, // Set editor
        last_edited_at: new Date().toISOString(), // Set timestamp
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add section: ${error.message}`);
      return null;
    } else {
      showSuccess("Section added successfully.");
      setSections(prev => [...prev, data]); // Update state directly
      return data;
    }
  };

  const handleDeleteSection = async (sectionId: string, currentSections: FormSection[], currentFields: FormField[]) => {
    // Optimistically update local state first
    const originalSections = [...currentSections];
    const originalFields = [...currentFields];
    setSections(currentSections.filter(s => s.id !== sectionId));
    setFields(currentFields.map(f => f.section_id === sectionId ? { ...f, section_id: null } : f)); // Move fields to uncategorized

    // Fetch fields associated with this section to update their section_id to null
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
      last_edited_by_user_id: user?.id || null, // Set editor
      last_edited_at: new Date().toISOString(), // Set timestamp
    }));

    // Perform batch update for fields
    const { error: updateFieldsError } = await supabase
      .from('form_fields')
      .upsert(updatesForFields);

    if (updateFieldsError) {
      showError(`Failed to uncategorize fields: ${updateFieldsError.message}. Reverting.`);
      setSections(originalSections);
      setFields(originalFields);
      return;
    }

    // Finally, delete the section
    const { error: deleteSectionError } = await supabase.from('form_sections').delete().eq('id', sectionId);
    if (deleteSectionError) {
      showError(`Failed to delete section: ${deleteSectionError.message}. Reverting.`);
      setSections(originalSections);
      setFields(originalFields); // Revert fields too if section deletion fails
    } else {
      showSuccess("Section and its fields uncategorized successfully.");
      fetchData(); // Re-fetch to ensure full consistency after all operations
    }
  };

  const handleAddField = async (label: string, type: FormField['field_type'], options: string, sectionId: string | null, helpText: string | null, description: string | null, tooltip: string | null, placeholder: string | null) => { // Added placeholder
    if (!label.trim() || !formId || !user) return null; // Use formId and user

    // Fetch current fields for the target section to determine next order
    const { data: currentFieldsInTargetSection, error: fetchError } = await supabase
      .from('form_fields')
      .select('order')
      .eq('form_id', formId) // Use formId
      .eq('section_id', sectionId);

    if (fetchError) {
      showError(`Failed to fetch fields for new order: ${fetchError.message}`);
      return null;
    }

    const nextOrder = currentFieldsInTargetSection && currentFieldsInTargetSection.length > 0 ? Math.max(...currentFieldsInTargetSection.map(f => f.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('form_fields')
      .insert({
        form_id: formId, // Use formId
        label: label,
        field_type: type,
        order: nextOrder,
        section_id: sectionId,
        options: (type === 'select' || type === 'radio' || type === 'checkbox') ? options.split(',').map(opt => opt.trim()) : null,
        is_required: false, // Default to not required when adding
        display_rules: null, // Default to no display rules
        help_text: helpText || null,
        description: description || null,
        tooltip: tooltip || null,
        placeholder: placeholder || null, // New: placeholder
        last_edited_by_user_id: user.id, // Set editor
        last_edited_at: new Date().toISOString(), // Set timestamp
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add field: ${error.message}`);
      return null;
    } else if (data) {
      setFields(prev => [...prev, data as FormField]); // Update state directly
      showSuccess("Field added successfully.");
      return data as FormField;
    }
    return null;
  };

  const handleDeleteField = async (fieldId: string) => {
    // Optimistic update
    setFields(prev => prev.filter(f => f.id !== fieldId));
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
    if (error) {
      showError(`Failed to delete field: ${error.message}. Reverting.`);
      fetchData(); // Re-fetch to revert if optimistic update fails
    } else {
      showSuccess("Field deleted successfully.");
    }
  };

  const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
    if (!user) return;
    // Optimistic update
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: isRequired } : f));
    const { error } = await supabase.from('form_fields').update({ is_required: isRequired, last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() }).eq('id', fieldId);
    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: !isRequired } : f)); // Revert
    } else {
      showSuccess("Field requirement updated.");
    }
  };

  const handleSaveLogic = async (fieldId: string, rules: DisplayRule[]) => {
    if (!user) return;
    // Optimistic update
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, display_rules: rules } : f))
    );
    const { error } = await supabase
      .from('form_fields')
      .update({ display_rules: rules, last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to save display logic: ${error.message}. Reverting.`);
      fetchData(); // Re-fetch to revert if optimistic update fails
    } else {
      showSuccess("Display logic saved successfully!");
    }
  };

  const handleSaveEditedField = async (fieldId: string, values: { label: string; field_type: FormField['field_type']; options?: string; is_required: boolean; help_text?: string | null; description?: string | null; tooltip?: string | null; placeholder?: string | null; section_id?: string | null; }) => { // Added placeholder
    if (!user) return;
    const updatedOptions = (values.field_type === 'select' || values.field_type === 'radio' || values.field_type === 'checkbox')
      ? values.options?.split(',').map(opt => opt.trim()) || null
      : null;

    // Optimistic update
    setFields(prevFields =>
      prevFields.map(f =>
        f.id === fieldId
          ? { ...f, label: values.label, field_type: values.field_type, options: updatedOptions, is_required: values.is_required, help_text: values.help_text || null, description: values.description || null, tooltip: values.tooltip || null, placeholder: values.placeholder || null, section_id: values.section_id === 'none' ? null : values.section_id } // Added placeholder
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
        placeholder: values.placeholder || null, // Added placeholder
        section_id: values.section_id === 'none' ? null : values.section_id, // Handle 'none' for uncategorized
        last_edited_by_user_id: user.id, // Set editor
        last_edited_at: new Date().toISOString(), // Set timestamp
      })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      fetchData(); // Re-fetch to revert if optimistic update fails
    } else {
      showSuccess("Field updated successfully!");
      fetchData(); // Re-fetch to ensure correct order and section display after update
    }
  };

  // New function for inline label update
  const handleUpdateFieldLabel = async (fieldId: string, newLabel: string) => {
    if (!user) return;
    // Optimistic update
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, label: newLabel } : f))
    );
    const { error } = await supabase
      .from('form_fields')
      .update({ label: newLabel, last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update label: ${error.message}. Reverting.`);
      fetchData(); // Re-fetch to revert if optimistic update fails
    } else {
      showSuccess("Field label updated.");
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
      showSuccess(`Form status updated to "${status}".`);
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
      // Do not show error here, as auto-save handles it
      return false;
    } else {
      return true;
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
    handleUpdateFieldLabel, // Export the new function
    handleUpdateFormStatus,
    handleUpdateFormDetails,
  };
};