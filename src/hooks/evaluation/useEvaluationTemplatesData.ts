import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError } from '@/utils/toast';
import { EvaluationTemplate } from '@/types';

export const useEvaluationTemplatesData = () => {
  const { user, profile } = useSession();
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('evaluation_templates')
      .select('*')
      .order('name', { ascending: true });

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      query = query.eq('user_id', user.id);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      showError("Error fetching evaluation templates: " + fetchError.message);
    } else {
      setTemplates(data as EvaluationTemplate[]);
    }
    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, setTemplates, loading, error, fetchTemplates };
};