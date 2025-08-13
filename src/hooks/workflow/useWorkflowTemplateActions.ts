import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { WorkflowTemplate, WorkflowStage } from '@/types';

interface UseWorkflowTemplateActionsProps {
  setTemplates?: React.Dispatch<React.SetStateAction<WorkflowTemplate[]>>;
  fetchTemplates?: () => void;
}

export const useWorkflowTemplateActions = ({ setTemplates, fetchTemplates }: UseWorkflowTemplateActionsProps) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBlankTemplate = async () => {
    if (!user) {
      showError("You must be logged in to create a workflow template.");
      return;
    }
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const { data: newTemplateData, error } = await supabase
      .from("workflow_templates")
      .insert({
        user_id: user.id,
        name: "New Workflow Template",
        status: 'draft',
        last_edited_by_user_id: user.id,
        last_edited_at: now,
        updated_at: now,
      })
      .select('id')
      .single();

    if (error || !newTemplateData) {
      showError(`Failed to create blank template: ${error?.message}`);
    } else {
      showSuccess("Blank template created successfully! Redirecting to the builder.");
      if (fetchTemplates) fetchTemplates();
      navigate(`/creator/workflows/${newTemplateData.id}/edit`);
    }
    setIsSubmitting(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      showError(`Failed to delete template: ${error.message}`);
    } else {
      showSuccess("Workflow template deleted successfully.");
      if (fetchTemplates) fetchTemplates();
    }
  };

  const handleUpdateTemplateStatus = async (templateId: string, newStatus: 'draft' | 'published') => {
    if (!user) return;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('workflow_templates')
      .update({ status: newStatus, last_edited_by_user_id: user.id, last_edited_at: now, updated_at: now })
      .eq('id', templateId);

    if (error) {
      showError(`Failed to update status: ${error.message}`);
    } else {
      showSuccess(`Template status updated to "${newStatus}".`);
      if (fetchTemplates) fetchTemplates();
    }
  };

  const handleUpdateTemplateDetails = async (templateId: string, name: string, description: string | null) => {
    if (!user) return;
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('workflow_templates')
      .update({ name, description, last_edited_by_user_id: user.id, last_edited_at: now, updated_at: now })
      .eq('id', templateId);

    if (error) {
      showError(`Failed to update details: ${error.message}`);
    } else {
      showSuccess("Template details saved.");
    }
    setIsSubmitting(false);
  };

  const handleAddStage = async (templateId: string, currentStages: WorkflowStage[]) => {
    if (!user) return null;
    const nextOrderIndex = currentStages.length > 0 ? Math.max(...currentStages.map(s => s.order_index)) + 1 : 1;
    const { data, error } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_template_id: templateId,
        name: "New Stage",
        step_type: "form", // Default type
        order_index: nextOrderIndex,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      showError(`Failed to add stage: ${error.message}`);
      return null;
    }
    return data as WorkflowStage;
  };

  const handleDeleteStage = async (stageId: string) => {
    const { error } = await supabase.from('workflow_steps').delete().eq('id', stageId);
    if (error) {
      showError(`Failed to delete stage: ${error.message}`);
      return false;
    }
    return true;
  };

  const handleUpdateStageOrder = async (updates: { id: string; order_index: number }[]) => {
    if (!user) return;
    const updatesWithMetadata = updates.map(u => ({ ...u, last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() }));
    const { error } = await supabase.from('workflow_steps').upsert(updatesWithMetadata);
    if (error) {
      showError(`Failed to save new order: ${error.message}`);
    } else {
      showSuccess("Stage order saved.");
    }
  };

  const handleUpdateStageDetails = async (stageId: string, payload: Partial<WorkflowStage>) => {
    if (!user) return false;
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('workflow_steps')
      .update({ ...payload, last_edited_by_user_id: user.id, last_edited_at: now, updated_at: now })
      .eq('id', stageId);

    if (error) {
      showError(`Failed to update stage details: ${error.message}`);
      return false;
    }
    showSuccess("Stage details updated.");
    return true;
  };
  
  return { 
    isSubmitting, 
    handleCreateBlankTemplate, 
    handleDeleteTemplate, 
    handleUpdateTemplateStatus,
    handleUpdateTemplateDetails,
    handleAddStage,
    handleDeleteStage,
    handleUpdateStageOrder,
    handleUpdateStageDetails,
  };
};