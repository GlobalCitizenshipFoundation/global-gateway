import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Form as FormType } from '@/types';
import { showError } from '@/utils/toast';

export const useFormsData = () => {
  const { user } = useSession();
  const [forms, setForms] = useState<FormType[]>([]);
  const [templates, setTemplates] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        showError("Error fetching forms: " + fetchError.message);
      } else {
        setForms(data as FormType[]);
        setTemplates(data.filter(f => f.is_template) as FormType[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  return { forms, setForms, templates, setTemplates, loading, error };
};