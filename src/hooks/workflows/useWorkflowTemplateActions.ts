import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { WorkflowTemplate } from '@/types';

interface UseWorkflowTemplateActionsProps {
  setTemplates: React.Dispatch<React.SetStateAction<WorkflowTemplate[]>>;
  fetchTemplates: () => void;
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
      })
      .select('id')
      .single();

    if (error || !newTemplateData) {
      showError(`Failed to create blank template: ${error?.message}`);
    } else {
      showSuccess("Blank template created successfully! Redirecting to the builder.");
      fetchTemplates(); // Refresh the list
      navigate(`/creator/workflows/${newTemplateData.id}/edit`);
    }
    setIsSubmitting(false);
  };
  
  return { isSubmitting, handleCreateBlankTemplate };
};