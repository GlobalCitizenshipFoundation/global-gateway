import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { Form as FormType } from '@/types'; // Removed TagType import
import { showError } from '@/utils/toast';

export const useFormsData = () => {
  const { user, profile } = useSession();
  const [forms, setForms] = useState<FormType[]>([]);
  const [templates, setTemplates] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('forms')
      .select('*') // Removed form_tags select
      .order('created_at', { ascending: false }); // Default sort

    // If user is not an admin or super_admin, only fetch their own forms
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      query = query.eq('user_id', user.id);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      showError("Error fetching forms: " + fetchError.message);
    } else {
      const formattedForms = data.map(form => ({
        ...form,
        // tags: form.form_tags.map((ft: { tags: TagType }) => ft.tags), // Removed: Map nested tags
      }));
      setForms(formattedForms as FormType[]);
      setTemplates(formattedForms.filter(f => f.is_template) as FormType[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, profile]);

  return { forms, setForms, templates, setTemplates, loading, error, fetchData };
};