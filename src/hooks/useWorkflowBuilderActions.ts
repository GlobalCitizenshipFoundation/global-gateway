import { supabase } from '@/integrations/supabase/client';
import { WorkflowStep } from '@/types';
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';

interface UseWorkflowBuilderActionsProps {
  templateId: string | undefined;
  setWorkflowSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>;
  fetchData: () => Promise<void>;
}

export const useWorkflowBuilderActions = ({
  templateId,
  setWorkflowSteps,
  fetchData,
}: UseWorkflowBuilderActionsProps) => {
  const { user } = useSession();

  const handleAddStep = async (name: string, description: string | null, stepType: WorkflowStep['step_type']) => {
    if (!name.trim() || !templateId || !user) return null;

    const { data: currentSteps, error: fetchError } = await supabase
      .from('workflow_steps')
      .select('order_index')
      .eq('workflow_template_id', templateId);

    if (fetchError) {
      showError(`Failed to fetch steps for new order: ${fetchError.message}`);
      return null;
    }

    const nextOrder = currentSteps && currentSteps.length > 0 ? Math.max(...currentSteps.map(s => s.order_index)) + 1 : 1;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_template_id: templateId,
        name: name,
        description: description,
        step_type: stepType,
        order_index: nextOrder,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add step: ${error.message}`);
      return null;
    } else {
      showSuccess("Step added successfully.");
      setWorkflowSteps(prev => [...prev, data]);
      return data;
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    setWorkflowSteps(prev => prev.filter(s => s.id !== stepId));
    const { error } = await supabase.from('workflow_steps').delete().eq('id', stepId);
    if (error) {
      showError(`Failed to delete step: ${error.message}. Reverting.`);
      fetchData();
    } else {
      showSuccess("Step deleted successfully.");
    }
  };

  const handleSaveEditedStep = async (stepId: string, values: { name: string; description: string | null; step_type: WorkflowStep['step_type']; }) => {
    if (!user) return;

    setWorkflowSteps(prevSteps =>
      prevSteps.map(s =>
        s.id === stepId
          ? { ...s, name: values.name, description: values.description, step_type: values.step_type }
          : s
      )
    );
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('workflow_steps')
      .update({
        name: values.name,
        description: values.description,
        step_type: values.step_type,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .eq('id', stepId);

    if (error) {
      showError(`Failed to update step: ${error.message}. Reverting.`);
      fetchData();
    } else {
      showSuccess("Step updated successfully!");
      fetchData(); // Re-fetch to ensure correct order after update
    }
  };

  const handleUpdateStepName = async (stepId: string, newName: string) => {
    if (!user) return;
    setWorkflowSteps(prevSteps =>
      prevSteps.map(s => (s.id === stepId ? { ...s, name: newName } : s))
    );
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('workflow_steps')
      .update({ name: newName, last_edited_by_user_id: user.id, last_edited_at: now })
      .eq('id', stepId);

    if (error) {
      showError(`Failed to update step name: ${error.message}. Reverting.`);
      fetchData();
    } else {
      showSuccess("Step name updated.");
    }
  };

  const handleUpdateTemplateStatus = async (id: string, status: 'draft' | 'published') => {
    if (!user) return false;
    const { error } = await supabase
      .from('workflow_templates')
      .update({ status: status, updated_at: new Date().toISOString(), last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      showError(`Failed to update template status: ${error.message}`);
      return false;
    } else {
      showSuccess(`Workflow template status updated to "${status}".`);
      return true;
    }
  };

  const handleUpdateTemplateDetails = async (id: string, name: string, description: string | null) => {
    if (!user) return false;
    const { error } = await supabase
      .from('workflow_templates')
      .update({ name: name, description: description, updated_at: new Date().toISOString(), last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return false;
    } else {
      return true;
    }
  };

  return {
    handleAddStep,
    handleDeleteStep,
    handleSaveEditedStep,
    handleUpdateStepName,
    handleUpdateTemplateStatus,
    handleUpdateTemplateDetails,
  };
};