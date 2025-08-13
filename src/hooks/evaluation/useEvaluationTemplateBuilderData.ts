import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EvaluationTemplate, EvaluationCriterion } from '@/types';
import { showError } from '@/utils/toast';

export const useEvaluationTemplateBuilderData = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!templateId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const templatePromise = supabase
      .from('evaluation_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    const criteriaPromise = supabase
      .from('evaluation_criteria')
      .select('*')
      .eq('template_id', templateId)
      .order('order', { ascending: true });

    const [{ data: templateData, error: templateError }, { data: criteriaData, error: criteriaError }] = await Promise.all([templatePromise, criteriaPromise]);

    if (templateError) {
      showError("Could not fetch template details.");
      setTemplate(null);
    } else {
      setTemplate(templateData as EvaluationTemplate);
    }

    if (criteriaError) {
      showError("Could not fetch evaluation criteria.");
      setCriteria([]);
    } else {
      setCriteria(criteriaData as EvaluationCriterion[]);
    }

    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    templateId,
    template,
    setTemplate,
    criteria,
    setCriteria,
    loading,
    fetchData,
  };
};