import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection, DisplayRule } from '@/types';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/auth/SessionContext';

interface UseFormBuilderActionsProps {
  formId: string | undefined;
  setSections: React.Dispatch<React.SetStateAction<FormSection[]>>;
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  fetchData: () => Promise<void>;
}

export const useFormBuilderActions = ({
  formId,
  setSections,
  setFields,
  fetchData,
}: UseFormBuilderActionsProps) => {
  const { user } = useSession();

  const handleAddSection = async (name: string, description: string | null, tooltip: string | null) => {
    if (!name.trim() || !formId || !user) return null;

    const { data: currentSections, error: fetchError } = await supabase
      .from('form_sections')
      .select('order')
      .eq('form_id', formId);

    if (fetchError) {
      showError(`Failed to fetch sections for new order: ${fetchError.message}`);
      return null;
    }

    const nextOrder = currentSections && currentSections.length > 0 ? Math.max(...currentSections.map(s => s.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('form_sections')
      .insert({
        form_id: formId,
        name: name,
        order: nextOrder,
        description: description,
        tooltip: tooltip,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add section: ${error.message}`);
      return null;
    } else {
      showSuccess("Section added successfully.");
      setSections(prev => [...prev, data]);
      return data;
    }
  };

  const handleDeleteSection = async (sectionId: string, fieldAction: 'delete_fields' | 'uncategorize_fields' | 'move_to_section', targetSectionId: string | null = null) => {
    if (!user) {
      showError("You must be logged in to delete a section.");
      return;
    }

    const { error } = await supabase.rpc('delete_form_section_with_field_handling', {
      p_section_id: sectionId,
      p_user_id: user.id,
      p_field_action: fieldAction,
      p_target_section_id: targetSectionId,
    });
  
    if (error) {
      showError(`Failed to delete section: ${error.message}`);
    } else {
      showSuccess("Section deleted and fields handled successfully.");
      fetchData(); // Re-fetch to update the UI
    }
  };

  const handleAddField = async (label: string, type: FormField['field_type'], options: string, sectionId: string | null, description: string | null, tooltip: string | null, placeholder: string | null) => {
    if (!label.trim() || !formId || !user) return null;

    let query = supabase
      .from('form_fields')
      .select('order')
      .eq('form_id', formId);
    
    // Conditionally apply section_id filter based on whether it's null
    if (sectionId === null) {
      query = query.is('section_id', null);
    } else {
      query = query.eq('section_id', sectionId);
    }

    const { data: currentFieldsInTargetSection, error: fetchError } = await query;

    if (fetchError) {
      showError(`Failed to fetch fields for new order: ${fetchError.message}`);
      return null;
    }

    const nextOrder = currentFieldsInTargetSection && currentFieldsInTargetSection.length > 0 ? Math.max(...currentFieldsInTargetSection.map(f => f.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('form_fields')
      .insert({
        form_id: formId,
        label: label,
        field_type: type,
        order: nextOrder,
        section_id: sectionId,
        options: (type === 'select' || type === 'radio' || type === 'checkbox') ? options.split(',').map(opt => opt.trim()) : null,
        is_required: false,
        display_rules: null,
        description: description || null,
        tooltip: tooltip || null,
        placeholder: placeholder || null,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
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
    setFields(prev => prev.filter(f => f.id !== fieldId));
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
    if (error) {
      showError(`Failed to delete field: ${error.message}. Reverting.`);
      fetchData();
    } else {
      showSuccess("Field deleted successfully.");
    }
  };

  const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
    if (!user) return;
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: isRequired } : f));
    const { error } = await supabase.from('form_fields').update({ is_required: isRequired, last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() }).eq('id', fieldId);
    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: !isRequired } : f));
    } else {
      showSuccess("Field requirement updated.");
    }
  };

  const handleSaveLogic = async (fieldId: string, rules: DisplayRule[]) => {
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
    }
  };

  const handleSaveEditedField = async (fieldId: string, values: { label: string; field_type: FormField['field_type']; options?: string; is_required: boolean; description?: string | null; tooltip?: string | null; placeholder?: string | null; section_id?: string | null; }) => {
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
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      fetchData();
    } else {
      showSuccess("Field updated successfully!");
      fetchData();
    }
  };

  const handleUpdateFieldLabel = async (fieldId: string, newLabel: string) => {
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
    handleUpdateFieldLabel,
    handleUpdateFormStatus,
    handleUpdateFormDetails,
  };
};