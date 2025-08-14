import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection, Form as FormType, Tag as TagType } from '@/types'; // Import FormType and TagType
import { showError } from '@/utils/toast';

export const useFormBuilderData = (initialFormId?: string) => { // Accept initialFormId as prop
  const { formId: paramFormId } = useParams<{ formId: string }>(); // Get formId from URL
  const currentFormId = initialFormId || paramFormId;

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState<string | null>(null); // New state for description
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [formLastEditedAt, setFormLastEditedAt] = useState<string | null>(null); // New
  const [formLastEditedByUserId, setFormLastEditedByUserId] = useState<string | null>(null); // New
  const [sections, setSections] = useState<FormSection[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFieldSectionId, setNewFieldSectionId] = useState<string | null>(null);
  const [formTags, setFormTags] = useState<FormType['tags']>([]); // New: State for form tags

  const fetchData = useCallback(async () => {
    if (!currentFormId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fetch form details and its associated tags
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('name, status, description, last_edited_at, last_edited_by_user_id, is_template, form_tags(tags(*))') // Fetch new columns and tags
      .eq('id', currentFormId)
      .single();
    
    if (formError) {
      showError("Could not fetch form details.");
      setFormName('');
      setFormDescription(null); // Reset description on error
      setFormStatus('draft');
      setFormLastEditedAt(null);
      setFormLastEditedByUserId(null);
      setFormTags([]); // Reset tags on error
    } else {
      setFormName(formData.name);
      setFormDescription(formData.description); // Set description
      setFormStatus(formData.status);
      setFormLastEditedAt(formData.last_edited_at);
      setFormLastEditedByUserId(formData.last_edited_by_user_id);
      // Correctly map the fetched data to the FormTag type
      setFormTags(formData.form_tags.map((ft: { tags: TagType | null }) => ft.tags).filter(Boolean) as TagType[] || []); // Set tags
    }

    // Fetch sections for the form, including new conditional logic fields
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('form_sections')
      .select('*, description, tooltip, display_rules, display_rules_logic_type') // Fetch new columns
      .eq('form_id', currentFormId) // Use form_id
      .order('order', { ascending: true });
    
    if (sectionsError) {
      showError("Could not fetch form sections.");
    } else {
      setSections(sectionsData || []);
    }

    // Fetch fields for the form
    const { data: fieldsData, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', currentFormId) // Use form_id
      .order('order', { ascending: true });

    if (fieldsError) {
      showError("Could not fetch form fields.");
    } else {
      setFields(fieldsData as FormField[]);
    }
    setLoading(false);
  }, [currentFormId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (sections.length > 0 && newFieldSectionId === null) {
      setNewFieldSectionId(sections[0].id);
    }
  }, [sections, newFieldSectionId]);

  const getFieldsForSection = useCallback((sectionId: string | null) => {
    return fields.filter(field => field.section_id === sectionId).sort((a, b) => a.order - b.order);
  }, [fields]);

  return {
    formId: currentFormId, // Return the resolved formId
    formName,
    formDescription, // Return formDescription
    formStatus,
    formLastEditedAt, // New
    formLastEditedByUserId, // New
    sections,
    setSections,
    fields,
    setFields,
    loading,
    newFieldSectionId,
    setNewFieldSectionId,
    fetchData,
    getFieldsForSection,
    formTags, // New: Return form tags
  };
};