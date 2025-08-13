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

  // New state for enhanced functionality
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);
  const [lastEditedByUserName, setLastEditedByUserName] = useState<string | null>(null);
  const [creatorUserName, setCreatorUserName] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!workflowId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const templatePromise = supabase
      .from('workflow_templates')
      .select('*, user_id, last_edited_by_user_id')
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

    if (stagesError) {
      showError("Could not fetch workflow stages.");
      setStages([]);
    } else {
      setStages(stagesData as WorkflowStage[]);
    }

    setLoading(false);
    setHasUnsavedChanges(false);
  }, [workflowId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    workflowId,
    template, setTemplate,
    stages, setStages,
    loading, fetchData,
    isAutoSaving, setIsAutoSaving,
    lastSavedTimestamp, setLastSavedTimestamp,
    hasUnsavedChanges, setHasUnsavedChanges,
    showSavedConfirmation, setShowSavedConfirmation,
    lastEditedByUserName,
    creatorUserName,
  };
};