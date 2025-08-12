import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { WorkflowTemplate, WorkflowStep } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export const useWorkflowBuilderState = (initialTemplateId?: string) => {
  const { templateId: paramTemplateId } = useParams<{ templateId: string }>();
  const currentTemplateId = initialTemplateId || paramTemplateId;

  // Template details state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState<string | null>(null);
  const [templateStatus, setTemplateStatus] = useState<'draft' | 'published'>('draft');
  const [templateLastEditedAt, setTemplateLastEditedAt] = useState<string | null>(null);
  const [templateLastEditedByUserId, setTemplateLastEditedByUserId] = useState<string | null>(null);
  const [lastEditedByUserName, setLastEditedByUserName] = useState<string | null>(null);

  // Workflow content state
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);

  // Loading and saving states
  const [loading, setLoading] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);

  // UI interaction states
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null); // For properties panel

  // New step input states
  const [newStepName, setNewStepName] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [newStepType, setNewStepType] = useState<WorkflowStep['step_type']>('custom');
  const [isAddingStep, setIsAddingStep] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentTemplateId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: templateData, error: templateError } = await supabase
      .from('workflow_templates')
      .select('name, description, status, last_edited_at, last_edited_by_user_id')
      .eq('id', currentTemplateId)
      .single();
    
    if (templateError) {
      showError("Could not fetch workflow template details.");
      setTemplateName('');
      setTemplateDescription(null);
      setTemplateStatus('draft');
      setTemplateLastEditedAt(null);
      setTemplateLastEditedByUserId(null);
    } else {
      setTemplateName(templateData.name);
      setTemplateDescription(templateData.description);
      setTemplateStatus(templateData.status);
      setTemplateLastEditedAt(templateData.last_edited_at);
      setTemplateLastEditedByUserId(templateData.last_edited_by_user_id);
    }

    const { data: stepsData, error: stepsError } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_template_id', currentTemplateId)
      .order('order_index', { ascending: true });
    
    if (stepsError) {
      showError("Could not fetch workflow steps.");
    } else {
      setWorkflowSteps(stepsData || []);
    }
    setLoading(false);
  }, [currentTemplateId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync local states with fetched data
  useEffect(() => {
    if (!loading) {
      setHasUnsavedChanges(false);
      setLastSavedTimestamp(templateLastEditedAt ? new Date(templateLastEditedAt) : null);
    }
  }, [loading, templateLastEditedAt]);

  // Fetch last edited by user's full name
  useEffect(() => {
    const fetchUserName = async () => {
      if (templateLastEditedByUserId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', templateLastEditedByUserId)
          .single();
        if (error) {
          console.error("Error fetching last edited user name:", error);
          setLastEditedByUserName(null);
        } else if (data) {
          const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
          setLastEditedByUserName(fullName || 'Unknown User');
        }
      } else {
        setLastEditedByUserName(null);
      }
    };
    fetchUserName();
  }, [templateLastEditedByUserId]);

  return {
    templateId: currentTemplateId,
    templateName, setTemplateName,
    templateDescription, setTemplateDescription,
    templateStatus, setTemplateStatus,
    templateLastEditedAt, setTemplateLastEditedAt,
    templateLastEditedByUserId, setTemplateLastEditedByUserId,
    lastEditedByUserName,
    workflowSteps, setWorkflowSteps,
    loading, fetchData,
    isAutoSaving, setIsAutoSaving,
    lastSavedTimestamp, setLastSavedTimestamp,
    hasUnsavedChanges, setHasUnsavedChanges,
    isUpdatingStatus, setIsUpdatingStatus,
    showSavedConfirmation, setShowSavedConfirmation,
    selectedStep, setSelectedStep,
    newStepName, setNewStepName,
    newStepDescription, setNewStepDescription,
    newStepType, setNewStepType,
    isAddingStep, setIsAddingStep,
  };
};