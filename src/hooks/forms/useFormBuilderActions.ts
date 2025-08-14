import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection, DisplayRule, Form as FormType } from '@/types';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/auth/SessionContext';

interface UseFormBuilderActionsProps {
  formId: string | undefined;
  setSections: React.Dispatch<React.SetStateAction<FormSection[]>>;
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  fetchData: () => Promise<void>; // To trigger a full re-fetch after complex operations
}

export const useFormBuilderActions = ({
  formId,
  setSections,
  setFields,
  fetchData,
}: UseFormBuilderActionsProps) => {
  const { user } = useSession();

  const handleAddSection = async (name: string, description: string | null, tooltip: string | null) => {
    if (!name.trim() || !formId || !user) {
      showError("Cannot add section: missing name, form ID, or user.");
      return null;
    }

    const { data: currentSections, error: fetchError } = await supabase
      .from('form_sections')
      .select('order')
      .eq('form_id', formId);

    if (fetchError) {
      showError(`Failed to fetch sections for new order: ${fetchError.message}`);
      return null;
    }

    const nextOrder = currentSections && currentSections.length > 0 ? Math.max(...currentSections.map(s => s.order)) + 1 : 1;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('form_sections')
      .insert({
        form_id: formId,
        name: name,
        order: nextOrder,
        description: description,
        tooltip: tooltip,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add section: ${error.message}`);
      return null;
    } else {
      setSections(prev => [...prev, data]);
      return data;
    }
  };

  const handleDeleteSection = async (sectionId: string, fieldAction: 'delete_fields' | 'uncategorize_fields' | 'move_to_section', targetSectionId: string | null = null) => {
    if (!user) {
      showError("You must be logged in to delete a section.");
      return false;
    }

    const { error } = await supabase.rpc('delete_form_section_with_field_handling', {
      p_section_id: sectionId,
      p_user_id: user.id,
      p_field_action: fieldAction,
      p_target_section_id: targetSectionId,
    });
  
    if (error) {
      showError(`Failed to delete section: ${error.message}`);
      return false;
    } else {
      // A full re-fetch is needed here because RPC can affect multiple rows (fields)
      await fetchData(); 
      return true;
    }
  };

  const handleSaveEditedSection = async (sectionId: string, values: { name: string; description?: string | null; tooltip?: string | null; }) => {
    if (!user) {
      showError("You must be logged in to update a section.");
      return false;
    }
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('form_sections')
      .update({
        name: values.name,
        description: values.description ?? null,
        tooltip: values.tooltip ?? null,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .eq('id', sectionId);

    if (error) {
      showError(`Failed to update section: ${error.message}.`);
      await fetchData(); // Re-fetch on error to ensure consistency
      return false;
    } else {
      await fetchData(); // Re-fetch on success to ensure UI consistency
      return true;
    }
  };

  const handleSaveSectionLogic = async (sectionId: string, rules: DisplayRule[], logicType: 'AND' | 'OR') => {
    if (!user) {
      showError("You must be logged in to save section display logic.");
      return false;
    }
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('form_sections')
      .update({ display_rules: rules, display_rules_logic_type: logicType, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', sectionId);

    if (error) {
      showError(`Failed to save section display logic: ${error.message}.`);
      await fetchData(); // Re-fetch on error
      return false;
    } else {
      await fetchData(); // Re-fetch on success to ensure UI consistency
      return true;
    }
  };

  const handleAddField = async (label: string, type: FormField['field_type'], options: string, sectionId: string | null, description: string | null, tooltip: string | null, placeholder: string | null) => {
    if (!label.trim() || !formId || !user) {
      showError("Cannot add field: missing label, form ID, or user.");
      return null;
    }

    let query = supabase
      .from('form_fields')
      .select('order')
      .eq('form_id', formId);
    
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
    const now = new Date().toISOString();

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
        is_anonymized: false,
        display_rules: null,
        display_rules_logic_type: 'AND',
        description: description || null,
        tooltip: tooltip || null,
        placeholder: placeholder || null,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
        date_min: null,
        date_max: null,
        date_allow_past: true,
        date_allow_future: true,
        rating_min_value: 1,
        rating_max_value: 5,
        rating_min_label: "Poor",
        rating_max_label: "Excellent",
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add field: ${error.message}`);
      return null;
    } else if (data) {
      setFields(prev => [...prev, data as FormField]);
      return data as FormField;
    }
    return null;
  };

  const handleDeleteField = async (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId)); // Optimistic update
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
    if (error) {
      showError(`Failed to delete field: ${error.message}. Reverting.`);
      await fetchData(); // Revert by re-fetching
      return false;
    } else {
      return true;
    }
  };

  const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
    if (!user) {
      showError("You must be logged in to update field requirement.");
      return false;
    }
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_required: isRequired } : f)); // Optimistic update
    const now = new Date().toISOString();
    const { error } = await supabase.from('form_fields').update({ is_required: isRequired, last_edited_by_user_id: user.id, last_edited_at: now }).eq('id', fieldId);
    if (error) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      await fetchData(); // Revert by re-fetching
      return false;
    } else {
      return true;
    }
  };

  const handleSaveLogic = async (fieldId: string, rules: DisplayRule[], logicType: 'AND' | 'OR') => {
    if (!user) {
      showError("You must be logged in to save display logic.");
      return false;
    }
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('form_fields')
      .update({ display_rules: rules, display_rules_logic_type: logicType, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to save display logic: ${error.message}.`);
      await fetchData(); // Re-fetch on error
      return false;
    } else {
      await fetchData(); // Re-fetch on success to ensure UI consistency
      return true;
    }
  };

  const handleSaveEditedField = async (fieldId: string, values: {
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
    if (!user) {
      showError("You must be logged in to update a field.");
      return false;
    }
    const updatedOptions = (values.field_type === 'select' || values.field_type === 'radio' || values.field_type === 'checkbox')
      ? values.options?.split(',').map(opt => opt.trim()) || null
      : null;

    const now = new Date().toISOString();
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
      last_edited_at: now,
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
      await fetchData(); // Re-fetch on error
      return false;
    } else {
      await fetchData(); // Re-fetch on success to ensure UI consistency
      return true;
    }
  };

  const handleUpdateFieldLabel = async (fieldId: string, newLabel: string) => {
    if (!user) {
      showError("You must be logged in to update field label.");
      return false;
    }
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, label: newLabel } : f))
    ); // Optimistic update
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('form_fields')
      .update({ label: newLabel, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update label: ${error.message}. Reverting.`);
      await fetchData(); // Revert by re-fetching
      return false;
    } else {
      return true;
    }
  };

  const handleUpdateFormStatus = async (id: string, status: 'draft' | 'published') => {
    if (!user) {
      showError("You must be logged in to update form status.");
      return false;
    }
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('forms')
      .update({ status: status, updated_at: now, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', id);

    if (error) {
      showError(`Failed to update form status: ${error.message}`);
      return false;
    } else {
      return true;
    }
  };

  const handleUpdateFormDetails = async (id: string, name: string, description: string | null) => {
    if (!user) {
      showError("You must be logged in to update form details.");
      return false;
    }
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('forms')
      .update({ name: name, description: description, updated_at: now, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', id);

    if (error) {
      showError(`Failed to update form details: ${error.message}`);
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

    let newTemplateFormData: { id: string } | null = null; // Declare outside try block
    try {
      const now = new Date().toISOString();
      const { data, error: newTemplateFormError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: newTemplateName,
        is_template: true,
        status: 'published',
        description: templateFormToCopy.description,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      }).select('id').single();

      if (newTemplateFormError || !data) {
        throw new Error(`Failed to create template form: ${newTemplateFormError?.message}`);
      }
      newTemplateFormData = data; // Assign to the outer variable

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
        throw new Error(`Failed to load current form content: ${sectionsError?.message || fieldsError?.message}`);
      }

      const oldSectionIdMap = new Map<string, string>();
      const newSectionsToInsert = currentSections.map(section => {
        const newSectionId = crypto.randomUUID();
        oldSectionIdMap.set(section.id, newSectionId);
        return {
          id: newSectionId,
          form_id: newTemplateFormData!.id, // Use newTemplateFormData.id
          name: section.name,
          order: section.order,
          description: section.description,
          tooltip: section.tooltip,
          display_rules: section.display_rules,
          display_rules_logic_type: section.display_rules_logic_type,
          last_edited_by_user_id: user.id,
          last_edited_at: now,
        };
      });

      const newFieldsToInsert = currentFields.map(field => ({
        id: crypto.randomUUID(),
        form_id: newTemplateFormData!.id, // Use newTemplateFormData.id
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
        throw new Error(`Failed to copy form content to template: ${insertSectionsError?.message || insertFieldsError?.message}`);
      }

      // Copy tags
      const { data: currentFormTags, error: tagsError } = await supabase
        .from('form_tags')
        .select('tag_id')
        .eq('form_id', templateFormToCopy.id);

      if (tagsError) {
        console.error("Error fetching original form tags:", tagsError);
      } else if (currentFormTags && currentFormTags.length > 0) {
        const newFormTagsToInsert = currentFormTags.map(ft => ({
          form_id: newTemplateFormData!.id, // Use newTemplateFormData.id
          tag_id: ft.tag_id,
        }));
        const { error: insertTagsError } = await supabase.from('form_tags').insert(newFormTagsToInsert);
        if (insertTagsError) {
          console.error("Failed to copy form tags:", insertTagsError);
        }
      }

      return true;
    } catch (err: any) {
      showError("An unexpected error occurred: " + err.message);
      // Clean up partially created template if an error occurred during content copying
      if (newTemplateFormData?.id) {
        await supabase.from('forms').delete().eq('id', newTemplateFormData.id);
      }
      return false;
    }
  };

  const handleUpdateFormTags = async (formId: string, tagIds: string[]) => {
    if (!user) {
      showError("You must be logged in to update form tags.");
      return false;
    }
    const now = new Date().toISOString();

    // Delete existing tags for this form
    const { error: deleteError } = await supabase
      .from('form_tags')
      .delete()
      .eq('form_id', formId);

    if (deleteError) {
      showError(`Failed to clear existing tags: ${deleteError.message}`);
      return false;
    }

    // Insert new tags
    if (tagIds.length > 0) {
      const newTags = tagIds.map(tagId => ({
        form_id: formId,
        tag_id: tagId,
      }));
      const { error: insertError } = await supabase
        .from('form_tags')
        .insert(newTags);

      if (insertError) {
        showError(`Failed to add new tags: ${insertError.message}`);
        return false;
      }
    }

    // Update form's last edited timestamp
    const { error: updateFormError } = await supabase
      .from('forms')
      .update({ last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', formId);

    if (updateFormError) {
      showError(`Failed to update form timestamp after tag change: ${updateFormError.message}`);
      return false;
    }

    return true;
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
    handleUpdateFormTags,
  };
};