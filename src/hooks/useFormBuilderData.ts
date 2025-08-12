import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection, Form as FormType } from '@/types'; // Import FormType
import { showError } from '@/utils/toast';

export const useFormBuilderData = (initialFormId?: string) => { // Accept initialFormId as prop
  const { formId: paramFormId } = useParams<{ formId: string }>(); // Get formId from URL
  const currentFormId = initialFormId || paramFormId; // Use prop or URL param

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState<string | null>(null); // New state for description
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [sections, setSections] = useState<FormSection[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFieldSectionId, setNewFieldSectionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentFormId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fetch form details
    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('name, status, description') // Fetch description
      .eq('id', currentFormId)
      .single();
    
    if (formError) {
      showError("Could not fetch form details.");
      setFormName('');
      setFormDescription(null); // Reset description on error
      setFormStatus('draft');
    } else {
      setFormName(formData.name);
      setFormDescription(formData.description); // Set description
      setFormStatus(formData.status);
    }

    // Fetch sections for the form
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('form_sections')
      .select('*')
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
    sections,
    setSections,
    fields,
    setFields,
    loading,
    newFieldSectionId,
    setNewFieldSectionId,
    fetchData,
    getFieldsForSection,
  };
};