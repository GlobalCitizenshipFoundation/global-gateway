import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError } from '@/utils/toast';
import { WorkflowTemplate } from '@/types';

export const useWorkflowTemplatesData = () => {
  const { user, profile } = useSession();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('workflow_templates')
      .select('*')
      .order('name', { ascending: true });

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      query = query.eq('user_id', user.id);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      showError("Error fetching workflow templates: " + fetchError.message);
    } else {
      setTemplates(data as WorkflowTemplate[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [user, profile]);

  return { templates, setTemplates, loading, error, fetchTemplates };
};