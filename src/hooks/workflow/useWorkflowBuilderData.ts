import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowTemplate, WorkflowStep } from '@/types';
import { showError } from '@/utils/toast';

export const useWorkflowBuilderData = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
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

    const stepsPromise = supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_template_id', workflowId)
      .order('order_index', { ascending: true });

    const [{ data: templateData, error: templateError }, { data: stepsData, error: stepsError }] = await Promise.all([templatePromise, stepsPromise]);

    if (templateError) {
      showError("Could not fetch workflow template details.");
      setTemplate(null);
    } else {
      setTemplate(templateData as WorkflowTemplate);
    }

    if (stepsError) {
      showError("Could not fetch workflow steps.");
      setSteps([]);
    } else {
      setSteps(stepsData as WorkflowStep[]);
    }

    setLoading(false);
  }, [workflowId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { workflowId, template, setTemplate, steps, setSteps, loading, fetchData };
};