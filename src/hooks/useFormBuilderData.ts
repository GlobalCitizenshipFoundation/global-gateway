import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection, Program } from '@/types';
import { showError } from '@/utils/toast';

export const useFormBuilderData = () => {
  const { programId } = useParams<{ programId: string }>();
  const [programTitle, setProgramTitle] = useState('');
  const [sections, setSections] = useState<FormSection[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFieldSectionId, setNewFieldSectionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!programId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: programData, error: programError } = await supabase
      .from('programs').select('title').eq('id', programId).single();
    
    if (programError) {
      showError("Could not fetch program details.");
    } else {
      setProgramTitle(programData.title);
    }

    const { data: sectionsData, error: sectionsError } = await supabase
      .from('form_sections').select('*').eq('program_id', programId).order('order', { ascending: true });
    
    if (sectionsError) {
      showError("Could not fetch form sections.");
    } else {
      setSections(sectionsData || []);
    }

    const { data: fieldsData, error: fieldsError } = await supabase
      .from('form_fields').select('*').eq('program_id', programId).order('order', { ascending: true });

    if (fieldsError) {
      showError("Could not fetch form fields.");
    } else {
      setFields(fieldsData as FormField[]);
    }
    setLoading(false);
  }, [programId]);

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
    programId,
    programTitle,
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