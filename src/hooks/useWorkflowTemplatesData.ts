import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { WorkflowTemplate } from '@/types';
import { showError } from '@/utils/toast';

export const useWorkflowTemplatesData = () => {
  const { user } = useSession();
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
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
        .from('workflow_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        showError("Error fetching workflow templates: " + fetchError.message);
      } else {
        setWorkflowTemplates(data as WorkflowTemplate[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  return { workflowTemplates, setWorkflowTemplates, loading, error };
};