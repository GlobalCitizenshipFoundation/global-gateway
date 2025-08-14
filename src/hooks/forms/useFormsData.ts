import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { Form as FormType, Tag as TagType } from '@/types';
import { showError } from '@/utils/toast';
import React from 'react'; // Explicit React import

export const useFormsData = () => {
  const { user, profile } = useSession();
  const [forms, setForms] = useState<FormType[]>([]);
  const [templates, setTemplates] = useState<FormType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (): Promise<void> => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('forms')
      .select('*, form_tags(tags(*))')
      .order('created_at', { ascending: false });

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      query = query.eq('user_id', user.id);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      showError("Error fetching forms: " + fetchError.message);
    } else {
      const formattedForms = data.map((form: any) => ({
        ...form,
        tags: form.form_tags.map((ft: { tags: TagType | null }) => ft.tags).filter((tag: TagType | null): tag is TagType => tag !== null),
      }));
      setForms(formattedForms as FormType[]);
      setTemplates(formattedForms.filter((f: FormType) => f.is_template) as FormType[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, profile]);

  return { forms, setForms, templates, setTemplates, loading, error, fetchData };
};