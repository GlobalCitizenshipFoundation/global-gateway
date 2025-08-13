import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowTemplate, WorkflowStage } from '@/types';
import { showError } from '@/utils/toast';

export const useWorkflowBuilderData = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!workflowId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const templatePromise = supabase
      .from('workflow_templates')
      .select('*')
      .eq('id', workflowId)
      .single();

    const stagesPromise = supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_template_id', workflowId)
      .order('order_index', { ascending: true });

    const [{ data: templateData, error: templateError }, { data: stagesData, error: stagesError }] = await Promise.all([templatePromise, stagesPromise]);

    if (templateError) {
      showError("Could not fetch workflow template details.");
      setTemplate(null);
    } else {
      setTemplate(templateData as WorkflowTemplate);
    }

    if (stagesError) {
      showError("Could not fetch workflow stages.");
      setStages([]);
    } else {
      setStages(stagesData as WorkflowStage[]);
    }

    setLoading(false);
  }, [workflowId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { workflowId, template, setTemplate, stages, setStages, loading, fetchData };
};