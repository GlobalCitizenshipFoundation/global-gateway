import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FormField, FormSection, Form as FormType, Tag as TagType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface FormBuilderData {
  formDetails: FormType | null;
  sections: FormSection[];
  fields: FormField[];
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export const useFormBuilderLoader = (initialFormId?: string): FormBuilderData => {
  const { formId: paramFormId } = useParams<{ formId: string }>();
  const currentFormId = initialFormId || paramFormId;

  const [formDetails, setFormDetails] = useState<FormType | null>(null);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentFormId) {
      setLoading(false);
      setError("Form ID is missing.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Fetch form details and its associated tags
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*, form_tags(tags(*))')
        .eq('id', currentFormId)
        .single();
      
      if (formError) {
        throw new Error("Could not fetch form details: " + formError.message);
      }
      
      const formattedFormDetails: FormType = {
        ...formData,
        tags: formData.form_tags.map((ft: { tags: TagType | null }) => ft.tags).filter((tag: TagType | null): tag is TagType => tag !== null),
      };
      setFormDetails(formattedFormDetails);

      // Fetch sections for the form
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('form_sections')
        .select('*, description, tooltip, display_rules, display_rules_logic_type')
        .eq('form_id', currentFormId)
        .order('order', { ascending: true });
      
      if (sectionsError) {
        throw new Error("Could not fetch form sections: " + sectionsError.message);
      }
      setSections(sectionsData || []);

      // Fetch fields for the form
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('id, form_id, section_id, label, field_type, options, is_required, order, display_rules, display_rules_logic_type, description, tooltip, placeholder, last_edited_by_user_id, last_edited_at, date_min, date_max, date_allow_past, date_allow_future, rating_min_value, rating_max_value, rating_min_label, rating_max_label, is_anonymized')
        .eq('form_id', currentFormId)
        .order('order', { ascending: true });

      if (fieldsError) {
        throw new Error("Could not fetch form fields: " + fieldsError.message);
      }
      setFields(fieldsData as FormField[]);

    } catch (err: any) {
      console.error("Error in useFormBuilderLoader:", err);
      setError(err.message || "An unknown error occurred while loading form data.");
      setFormDetails(null);
      setSections([]);
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, [currentFormId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { formDetails, sections, fields, loading, error, fetchData };
};