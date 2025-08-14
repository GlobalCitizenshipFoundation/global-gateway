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

  // New state for enhanced functionality
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  const [lastEditedByUserName, setLastEditedByUserName] = useState<string | null>(null);
  const [creatorUserName, setCreatorUserName] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!templateId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: templateData, error: templateError } = await supabase
      .from('evaluation_templates')
      .select('*, user_id, last_edited_by_user_id')
      .eq('id', templateId)
      .single();

    if (templateError) {
      showError("Could not fetch template details.");
      setTemplate(null);
    } else {
      setTemplate(templateData as EvaluationTemplate);
      setLastSavedTimestamp(templateData.last_edited_at ? new Date(templateData.last_edited_at) : null);

      const userIds = new Set<string>();
      if (templateData.user_id) userIds.add(templateData.user_id);
      if (templateData.last_edited_by_user_id) userIds.add(templateData.last_edited_by_user_id);

      if (userIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', Array.from(userIds));
        
        if (!profilesError && profilesData) {
          const userNamesMap = new Map(profilesData.map(p => [p.id, [p.first_name, p.last_name].filter(Boolean).join(' ')]));
          if (templateData.user_id) setCreatorUserName(userNamesMap.get(templateData.user_id) || 'Unknown User');
          if (templateData.last_edited_by_user_id) setLastEditedByUserName(userNamesMap.get(templateData.last_edited_by_user_id) || 'Unknown User');
        }
      }
    }

    const { data: criteriaData, error: criteriaError } = await supabase
      .from('evaluation_criteria')
      .select('*')
      .eq('template_id', templateId)
      .order('order', { ascending: true });

    if (criteriaError) {
      showError("Could not fetch evaluation criteria.");
      setCriteria([]);
    } else {
      setCriteria(criteriaData as EvaluationCriterion[]);
    }

    setLoading(false);
    setHasUnsavedChanges(false);
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
    isAutoSaving, setIsAutoSaving,
    lastSavedTimestamp, setLastSavedTimestamp,
    hasUnsavedChanges, setHasUnsavedChanges,
    showSavedConfirmation, setShowSavedConfirmation,
    lastEditedByUserName,
    creatorUserName,
  };
};