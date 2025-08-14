import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { EvaluationTemplate } from '@/types';
import { isEvaluationTemplatePublishable } from '@/utils/evaluation/evaluationValidation';

interface UseEvaluationTemplateActionsProps {
  fetchTemplates?: () => void;
}

export const useEvaluationTemplateActions = ({ fetchTemplates }: UseEvaluationTemplateActionsProps) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTemplate = async () => {
    if (!user) {
      showError("You must be logged in to create a template.");
      return;
    }
    setIsSubmitting(true);
    const { data: newTemplate, error } = await supabase
      .from("evaluation_templates")
      .insert({
        user_id: user.id,
        name: "New Evaluation Template",
        description: "A brief description of what this template is for.",
        status: 'draft',
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !newTemplate) {
      showError(`Failed to create template: ${error?.message}`);
    } else {
      showSuccess("Template created successfully! Redirecting to the builder.");
      if (fetchTemplates) fetchTemplates();
      navigate(`/creator/evaluation-templates/${newTemplate.id}/edit`);
    }
    setIsSubmitting(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('evaluation_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      showError(`Failed to delete template: ${error.message}`);
    } else {
      showSuccess("Evaluation template deleted successfully.");
      if (fetchTemplates) fetchTemplates();
    }
  };

  const handleUpdateTemplateStatus = async (templateId: string, newStatus: 'draft' | 'published') => {
    if (!user) return;

    if (newStatus === 'published') {
      const { data: criteria, error: criteriaError } = await supabase
        .from('evaluation_criteria')
        .select('*')
        .eq('template_id', templateId);

      if (criteriaError) {
        showError("Could not verify template criteria before publishing.");
        return;
      }

      const { publishable, errors } = isEvaluationTemplatePublishable(criteria);
      if (!publishable) {
        const errorMessages = Array.from(errors.values()).join('\n');
        showError(`Cannot publish template. Please fix the following issues:\n${errorMessages}`, {
          duration: 10000,
        });
        return;
      }
    }

    const { error } = await supabase
      .from('evaluation_templates')
      .update({ 
        status: newStatus,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .eq('id', templateId);

    if (error) {
      showError(`Failed to update status: ${error.message}`);
    } else {
      showSuccess(`Template status updated to "${newStatus}".`);
      if (fetchTemplates) fetchTemplates();
    }
  };

  return { 
    isSubmitting, 
    handleCreateTemplate,
    handleDeleteTemplate,
    handleUpdateTemplateStatus,
  };
};