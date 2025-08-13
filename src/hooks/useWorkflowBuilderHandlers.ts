import { useCallback, useRef } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { WorkflowStep } from '@/types';
import { useWorkflowBuilderState } from './useWorkflowBuilderState';

interface UseWorkflowBuilderHandlersProps {
  state: ReturnType<typeof useWorkflowBuilderState>;
  performUpdateTemplateDetails: (id: string, name: string, description: string | null) => Promise<boolean>;
  performUpdateTemplateStatus: (id: string, status: 'draft' | 'published') => Promise<boolean>;
}

const AUTO_SAVE_DEBOUNCE_TIME = 2000; // 2 seconds
const SAVED_CONFIRMATION_DISPLAY_TIME = 2000; // 2 seconds

export const useWorkflowBuilderHandlers = ({
  state,
  performUpdateTemplateDetails,
  performUpdateTemplateStatus,
}: UseWorkflowBuilderHandlersProps) => {
  const { user } = useSession();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedConfirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    templateId,
    templateName,
    templateDescription,
    setTemplateStatus,
    setWorkflowSteps,
    fetchData,
    setIsAutoSaving,
    setLastSavedTimestamp,
    setHasUnsavedChanges,
    setIsUpdatingStatus,
    setShowSavedConfirmation,
    setTemplateLastEditedAt,
    setTemplateLastEditedByUserId,
    newStepName, setNewStepName,
    newStepDescription, setNewStepDescription,
    newStepType, setNewStepType,
    setIsAddingStep,
  } = state;

  const showSavedFeedback = useCallback(() => {
    if (savedConfirmationTimeoutRef.current) {
      clearTimeout(savedConfirmationTimeoutRef.current);
    }
    setShowSavedConfirmation(true);
    savedConfirmationTimeoutRef.current = setTimeout(() => {
      setShowSavedConfirmation(false);
    }, SAVED_CONFIRMATION_DISPLAY_TIME);
  }, [setShowSavedConfirmation]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setHasUnsavedChanges(true); // Indicate unsaved changes immediately
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!templateId || !user) return;

      setIsAutoSaving(true);
      const now = new Date().toISOString();
      const success = await performUpdateTemplateDetails(templateId, templateName, templateDescription);
      
      if (success) {
        setLastSavedTimestamp(new Date(now));
        setTemplateLastEditedAt(now);
        setTemplateLastEditedByUserId(user.id);
        setHasUnsavedChanges(false);
        showSavedFeedback();
      } else {
        showError("Auto-save failed. Please check your connection.");
      }
      setIsAutoSaving(false);
    }, AUTO_SAVE_DEBOUNCE_TIME);
  }, [templateId, templateName, templateDescription, user, performUpdateTemplateDetails, setIsAutoSaving, setLastSavedTimestamp, setHasUnsavedChanges, setShowSavedConfirmation, setTemplateLastEditedAt, setTemplateLastEditedByUserId, showSavedFeedback]);

  const handleAddStep = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepName.trim() || !templateId || !user) return;

    setIsAddingStep(true);
    const { data: currentSteps, error: fetchError } = await supabase
      .from('workflow_steps')
      .select('order_index')
      .eq('workflow_template_id', templateId);

    if (fetchError) {
      showError(`Failed to fetch steps for new order: ${fetchError.message}`);
      setIsAddingStep(false);
      return;
    }

    const nextOrder = currentSteps && currentSteps.length > 0 ? Math.max(...currentSteps.map(s => s.order_index)) + 1 : 1;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_template_id: templateId,
        name: newStepName,
        description: newStepDescription || null,
        step_type: newStepType,
        order_index: nextOrder,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add step: ${error.message}`);
    } else if (data) {
      setWorkflowSteps(prev => [...prev, data]);
      showSuccess("Step added successfully.");
      setNewStepName('');
      setNewStepDescription('');
      setNewStepType('custom');
      setHasUnsavedChanges(true);
      setTemplateLastEditedAt(now);
      setTemplateLastEditedByUserId(user.id);
      triggerAutoSave();
    }
    setIsAddingStep(false);
  }, [templateId, newStepName, newStepDescription, newStepType, user, setWorkflowSteps, setNewStepName, setNewStepDescription, setNewStepType, setHasUnsavedChanges, setTemplateLastEditedAt, setTemplateLastEditedByUserId, setIsAddingStep, triggerAutoSave]);

  const handleDeleteStep = useCallback(async (stepId: string) => {
    setWorkflowSteps(prev => prev.filter(s => s.id !== stepId));
    setHasUnsavedChanges(true);
    const { error } = await supabase.from('workflow_steps').delete().eq('id', stepId);
    if (error) {
      showError(`Failed to delete step: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false);
    } else {
      showSuccess("Step deleted successfully.");
      const now = new Date().toISOString();
      setTemplateLastEditedAt(now);
      setTemplateLastEditedByUserId(user?.id || null);
      triggerAutoSave();
    }
  }, [setWorkflowSteps, fetchData, setHasUnsavedChanges, setTemplateLastEditedAt, setTemplateLastEditedByUserId, user, triggerAutoSave]);

  const handleSaveEditedStep = useCallback(async (stepId: string, values: { name: string; description: string | null; step_type: WorkflowStep['step_type']; }) => {
    if (!user) return;
    setWorkflowSteps(prevSteps =>
      prevSteps.map(s =>
        s.id === stepId
          ? { ...s, name: values.name, description: values.description, step_type: values.step_type }
          : s
      )
    );
    setHasUnsavedChanges(true);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('workflow_steps')
      .update({
        name: values.name,
        description: values.description || null,
        step_type: values.step_type,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .eq('id', stepId);

    if (error) {
      showError(`Failed to update step: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false);
    } else {
      showSuccess("Step updated successfully!");
      fetchData(); // Re-fetch to ensure correct order after update
      setTemplateLastEditedAt(now);
      setTemplateLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [setWorkflowSteps, user, fetchData, setHasUnsavedChanges, setTemplateLastEditedAt, setTemplateLastEditedByUserId, triggerAutoSave]);

  const handleUpdateStepName = useCallback(async (stepId: string, newName: string) => {
    if (!user) return;
    setWorkflowSteps(prevSteps =>
      prevSteps.map(s => (s.id === stepId ? { ...s, name: newName } : s))
    );
    setHasUnsavedChanges(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('workflow_steps')
      .update({ name: newName, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', stepId);

    if (error) {
      showError(`Failed to update step name: ${error.message}. Reverting.`);
      fetchData();
      setHasUnsavedChanges(false);
    } else {
      showSuccess("Step name updated.");
      setTemplateLastEditedAt(now);
      setTemplateLastEditedByUserId(user.id);
      triggerAutoSave();
    }
  }, [setWorkflowSteps, user, fetchData, setHasUnsavedChanges, setTemplateLastEditedAt, setTemplateLastEditedByUserId, triggerAutoSave]);

  const handlePublishUnpublish = useCallback(async (status: 'draft' | 'published') => {
    if (!templateId || !user) return false;
    setIsUpdatingStatus(true);
    const now = new Date().toISOString();
    const success = await performUpdateTemplateStatus(templateId, status);
    if (success) {
      setTemplateStatus(status);
      setHasUnsavedChanges(false);
      setTemplateLastEditedAt(now);
      setTemplateLastEditedByUserId(user.id);
      showSavedFeedback();
    }
    setIsUpdatingStatus(false);
    return success;
  }, [templateId, user, performUpdateTemplateStatus, setTemplateStatus, setHasUnsavedChanges, setTemplateLastEditedAt, setTemplateLastEditedByUserId, setIsUpdatingStatus, showSavedFeedback]);

  const handleManualSaveDraft = useCallback(async () => {
    if (!templateId || !user) return;
    setIsAutoSaving(true);
    const now = new Date().toISOString();
    const success = await performUpdateTemplateDetails(templateId, templateName, templateDescription);
    if (success) {
      setLastSavedTimestamp(new Date(now));
      setTemplateLastEditedAt(now);
      setTemplateLastEditedByUserId(user.id);
      setHasUnsavedChanges(false);
      showSuccess("Workflow template draft saved successfully!");
      showSavedFeedback();
    } else {
      showError("Failed to save draft. Please try again.");
    }
    setIsAutoSaving(false);
  }, [templateId, templateName, templateDescription, user, performUpdateTemplateDetails, setIsAutoSaving, setLastSavedTimestamp, setHasUnsavedChanges, setTemplateLastEditedAt, setTemplateLastEditedByUserId, showSavedFeedback]);

  return {
    triggerAutoSave,
    handleAddStep,
    handleDeleteStep,
    handleSaveEditedStep,
    handleUpdateStepName,
    handlePublishUnpublish,
    handleManualSaveDraft,
  };
};