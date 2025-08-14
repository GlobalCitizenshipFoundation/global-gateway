import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection, DisplayRule, Form as FormType, Tag as TagType } from '@/types'; // Import TagType
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/auth/SessionContext';
import React from 'react'; // Explicit React import

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

  const getNextOrder = async (tableName: string, parentIdColumn: string, parentId: string | null): Promise<number> => {
    let query = supabase
      .from(tableName)
      .select('order')
      .eq('form_id', formId);

    if (parentIdColumn === 'section_id') {
      if (parentId === null) {
        query = query.is('section_id', null);
      } else {
        query = query.eq('section_id', parentId);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Error fetching order for ${tableName}:`, error);
      throw new Error(`Failed to determine order: ${error.message}`);
    }
    return data && data.length > 0 ? Math.max(...data.map((item: any) => item.order)) + 1 : 1;
  };

  const createMetadata = () => {
    const now = new Date().toISOString();
    return {
      last_edited_by_user_id: user?.id || null,
      last_edited_at: now,
    };
  };

  const handleAddSection = async (name: string, description: string | null, tooltip: string | null): Promise<FormSection | null> => {
    if (!name.trim() || !formId || !user) {
      showError("Cannot add section: missing name, form ID, or user.");
      return null;
    }

    try {
      const nextOrder = await getNextOrder('form_sections', 'section_id', null);
      const metadata = createMetadata();

      const { data, error } = await supabase
        .from('form_sections')
        .insert({
          form_id: formId,
          name: name,
          order: nextOrder,
          description: description,
          tooltip: tooltip,
          ...metadata,
        })
        .select()
        .single();

      if (error) throw error;
      setSections(prev => [...prev, data as FormSection]);
      return data as FormSection;
    } catch (error: any) {
      showError(`Failed to add section: ${error.message}`);
      return null;
    }
  };

  const handleDeleteSection = async (sectionId: string, fieldAction: 'delete_fields' | 'uncategorize_fields' | 'move_to_section', targetSectionId: string | null = null): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to delete a section.");
      return false;
    }

    try {
      const { error } = await supabase.rpc('delete_form_section_with_field_handling', {
        p_section_id: sectionId,
        p_user_id: user.id,
        p_field_action: fieldAction,
        p_target_section_id: targetSectionId,
      });
    
      if (error) throw error;
      await fetchData();
      return true;
    } catch (error: any) {
      showError(`Failed to delete section: ${error.message}`);
      return false;
    }
  };

  const handleSaveEditedSection = async (sectionId: string, values: { name: string; description?: string | null; tooltip?: string | null; }): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to update a section.");
      return false;
    }
    try {
      const metadata = createMetadata();
      const { error } = await supabase
        .from('form_sections')
        .update({
          name: values.name,
          description: values.description ?? null,
          tooltip: values.tooltip ?? null,
          ...metadata,
        })
        .eq('id', sectionId);

      if (error) throw error;
      await fetchData();
      return true;
    } catch (error: any) {
      showError(`Failed to update section: ${error.message}.`);
      await fetchData();
      return false;
    }
  };

  const handleSaveSectionLogic = async (sectionId: string, rules: DisplayRule[], logicType: 'AND' | 'OR'): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to save section display logic.");
      return false;
    }
    try {
      const metadata = createMetadata();
      const { error } = await supabase
        .from('form_sections')
        .update({ display_rules: rules, display_rules_logic_type: logicType, ...metadata })
        .eq('id', sectionId);

      if (error) throw error;
      await fetchData();
      return true;
    } catch (error: any) {
      showError(`Failed to save section display logic: ${error.message}.`);
      await fetchData();
      return false;
    }
  };

  const handleAddField = async (label: string, type: FormField['field_type'], options: string, sectionId: string | null, description: string | null, tooltip: string | null, placeholder: string | null): Promise<FormField | null> => {
    if (!label.trim() || !formId || !user) {
      showError("Cannot add field: missing label, form ID, or user.");
      return null;
    }

    try {
      const nextOrder = await getNextOrder('form_fields', 'section_id', sectionId);
      const metadata = createMetadata();

      const { data, error } = await supabase
        .from('form_fields')
        .insert({
          form_id: formId,
          label: label,
          field_type: type,
          order: nextOrder,
          section_id: sectionId,
          options: (type === 'select' || type === 'radio' || type === 'checkbox') ? options.split(',').map((opt: string) => opt.trim()) : null,
          is_required: false,
          is_anonymized: false,
          display_rules: null,
          display_rules_logic_type: 'AND',
          description: description || null,
          tooltip: tooltip || null,
          placeholder: placeholder || null,
          date_min: null,
          date_max: null,
          date_allow_past: true,
          date_allow_future: true,
          rating_min_value: 1,
          rating_max_value: 5,
          rating_min_label: "Poor",
          rating_max_label: "Excellent",
          ...metadata,
        })
        .select()
        .single();

      if (error) throw error;
      setFields(prev => [...prev, data as FormField]);
      return data as FormField;
    } catch (error: any) {
      showError(`Failed to add field: ${error.message}`);
      return null;
    }
  };

  const handleDeleteField = async (fieldId: string): Promise<boolean> => {
    try {
      setFields(prev => prev.filter((f: FormField) => f.id !== fieldId));
      const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
      if (error) throw error;
      return true;
    } catch (error: any) {
      showError(`Failed to delete field: ${error.message}. Reverting.`);
      await fetchData();
      return false;
    }
  };

  const handleToggleRequired = async (fieldId: string, isRequired: boolean): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to update field requirement.");
      return false;
    }
    try {
      setFields(prev => prev.map((f: FormField) => f.id === fieldId ? { ...f, is_required: isRequired } : f));
      const metadata = createMetadata();
      const { error: updateError } = await supabase.from('form_fields').update({ is_required: isRequired, ...metadata }).eq('id', fieldId);
      if (updateError) throw updateError;
      return true;
    } catch (error: any) {
      showError(`Failed to update field: ${error.message}. Reverting.`);
      await fetchData();
      return false;
    }
  };

  const handleSaveLogic = async (fieldId: string, rules: DisplayRule[], logicType: 'AND' | 'OR'): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to save display logic.");
      return false;
    }
    try {
      const metadata = createMetadata();
      const { error } = await supabase
        .from('form_fields')
        .update({ display_rules: rules, display_rules_logic_type: logicType, ...metadata })
        .eq('id', fieldId);

      if (error) throw error;
      await fetchData();
      return true;
    } catch (error: any) {
      showError(`Failed to save display logic: ${error.message}.`);
      await fetchData();
      return false;
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
  }): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to update a field.");
      return false;
    }
    try {
      const updatedOptions = (values.field_type === 'select' || values.field_type === 'radio' || values.field_type === 'checkbox')
        ? values.options?.split(',').map((opt: string) => opt.trim()) || null
        : null;

      const metadata = createMetadata();
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
        ...metadata,
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

      if (error) throw error;
      await fetchData();
      return true;
    } catch (error: any) {
      showError(`Failed to update field: ${error.message}.`);
      await fetchData();
      return false;
    }
  };

  const handleUpdateFieldLabel = async (fieldId: string, newLabel: string): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to update field label.");
      return false;
    }
    try {
      setFields(prevFields =>
        prevFields.map((f: FormField) => (f.id === fieldId ? { ...f, label: newLabel } : f))
      );
      const metadata = createMetadata();
      const { error } = await supabase
        .from('form_fields')
        .update({ label: newLabel, ...metadata })
        .eq('id', fieldId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      showError(`Failed to update label: ${error.message}. Reverting.`);
      await fetchData();
      return false;
    }
  };

  const handleUpdateFormStatus = async (id: string, status: 'draft' | 'published'): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to update form status.");
      return false;
    }
    try {
      const metadata = createMetadata();
      const { error } = await supabase
        .from('forms')
        .update({ status: status, updated_at: metadata.last_edited_at, ...metadata })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      showError(`Failed to update form status: ${error.message}`);
      return false;
    }
  };

  const handleUpdateFormDetails = async (id: string, name: string, description: string | null): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to update form details.");
      return false;
    }
    try {
      const metadata = createMetadata();
      const { error } = await supabase
        .from('forms')
        .update({ name: name, description: description, updated_at: metadata.last_edited_at, ...metadata })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      showError(`Failed to update form details: ${error.message}`);
      return false;
    }
  };

  const handleSaveAsTemplate = async (templateFormToCopy: FormType, newTemplateName: string): Promise<boolean> => {
    if (!templateFormToCopy || !newTemplateName.trim()) {
      showError("Template name cannot be empty.");
      return false;
    }
    if (!user) {
      showError("You must be logged in to save a template.");
      return false;
    }

    let newTemplateFormData: { id: string } | null = null;
    try {
      const metadata = createMetadata();
      const { data, error: newTemplateFormError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: newTemplateName,
        is_template: true,
        status: 'published',
        description: templateFormToCopy.description,
        ...metadata,
      }).select('id').single();

      if (newTemplateFormError || !data) {
        throw new Error(`Failed to create template form: ${newTemplateFormError?.message}`);
      }
      newTemplateFormData = data;

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

      const newSectionsToInsert = (currentSections as FormSection[]).map((section: FormSection) => {
        const newSectionId = crypto.randomUUID();
        return {
          id: newSectionId,
          form_id: newTemplateFormData!.id,
          name: section.name,
          order: section.order,
          description: section.description,
          tooltip: section.tooltip,
          display_rules: section.display_rules,
          display_rules_logic_type: section.display_rules_logic_type,
          ...metadata,
        };
      });

      const newFieldsToInsert = (currentFields as FormField[]).map((field: FormField) => ({
        id: crypto.randomUUID(),
        form_id: newTemplateFormData!.id,
        section_id: field.section_id ? newSectionsToInsert.find((s: FormSection) => s.name === (currentSections as FormSection[]).find((cs: FormSection) => cs.id === field.section_id)?.name)?.id || null : null,
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
        date_min: field.date_min,
        date_max: field.date_max,
        date_allow_past: field.date_allow_past,
        date_allow_future: field.date_allow_future,
        rating_min_value: field.rating_min_value,
        rating_max_value: field.rating_max_value,
        rating_min_label: field.rating_min_label,
        rating_max_label: field.rating_max_label,
        ...metadata,
      }));

      const { error: insertSectionsError } = await supabase.from('form_sections').insert(newSectionsToInsert);
      const { error: insertFieldsError } = await supabase.from('form_fields').insert(newFieldsToInsert);

      if (insertSectionsError || insertFieldsError) {
        throw new Error(`Failed to copy form content to template: ${insertSectionsError?.message || insertFieldsError?.message}`);
      }

      const { data: currentFormTags, error: tagsError } = await supabase
        .from('form_tags')
        .select('tag_id')
        .eq('form_id', templateFormToCopy.id);

      if (tagsError) {
        console.error("Error fetching original form tags:", tagsError);
      } else if (currentFormTags && currentFormTags.length > 0) {
        const newFormTagsToInsert = currentFormTags.map((ft: { tag_id: string }) => ({
          form_id: newTemplateFormData!.id,
          tag_id: ft.tag_id,
        }));
        const { error: insertTagsError } = await supabase.from('form_tags').insert(newFormTagsToInsert);
        if (insertTagsError) {
          console.error("Failed to copy form tags:", insertTagsError);
        }
      }

      return true;
    } catch (error: any) {
      showError("An unexpected error occurred: " + error.message);
      if (newTemplateFormData?.id) {
        await supabase.from('forms').delete().eq('id', newTemplateFormData.id);
      }
      return false;
    }
  };

  const handleUpdateFormTags = async (formId: string, tagIds: string[]): Promise<boolean> => {
    if (!user) {
      showError("You must be logged in to update form tags.");
      return false;
    }
    try {
      const metadata = createMetadata();

      const { error: deleteError } = await supabase
        .from('form_tags')
        .delete()
        .eq('form_id', formId);

      if (deleteError) throw deleteError;

      if (tagIds.length > 0) {
        const newTags = tagIds.map((tagId: string) => ({
          form_id: formId,
          tag_id: tagId,
        }));
        const { error: insertError } = await supabase
          .from('form_tags')
          .insert(newTags);

        if (insertError) throw insertError;
      }

      const { error: updateFormError } = await supabase
          .from('forms')
          .update({ updated_at: metadata.last_edited_at, ...metadata })
          .eq('id', formId);

      if (updateFormError) throw updateFormError;

      return true;
    } catch (error: any) {
      showError(`Failed to update form tags: ${error.message}`);
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
    handleUpdateFormTags,
  };
};