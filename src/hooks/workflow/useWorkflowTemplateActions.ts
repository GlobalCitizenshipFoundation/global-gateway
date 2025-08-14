import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { WorkflowTemplate, WorkflowStage, EvaluationCriterion, EmailTemplate, Form } from '@/types';
import { isWorkflowPublishable } from '@/utils/workflow/workflowValidation';
import { isEvaluationTemplatePublishable } from '@/utils/evaluation/evaluationValidation';

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
    if (!user) return false;

    if (newStatus === 'published') {
      const { data: stages, error: stagesError } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_template_id', templateId);

      if (stagesError) {
        showError("Could not verify workflow stages before publishing.");
        return false;
      }

      const { data: publishedEmailTemplates, error: emailTemplatesError } = await supabase
        .from('email_templates')
        .select('*') // Select all to get status
        .eq('status', 'published');

      if (emailTemplatesError) {
        showError("Could not verify email templates before publishing.");
        return false;
      }

      const { data: publishedForms, error: formsError } = await supabase
        .from('forms')
        .select('*') // Select all to get status
        .eq('status', 'published');

      if (formsError) {
        showError("Could not verify forms before publishing.");
        return false;
      }

      const { publishable: basePublishable, errors: baseErrors } = isWorkflowPublishable(stages as WorkflowStage[], publishedEmailTemplates as EmailTemplate[], publishedForms as Form[]);
      let combinedErrors = new Map(baseErrors);
      let isFullyPublishable = basePublishable;

      const evalTemplateIds = stages
        .filter(s => s.step_type === 'review' && s.evaluation_template_id)
        .map(s => s.evaluation_template_id);

      if (evalTemplateIds.length > 0) {
        const { data: allCriteria, error: criteriaError } = await supabase
          .from('evaluation_criteria')
          .select('*')
          .in('template_id', evalTemplateIds);
        
        if (criteriaError) {
          showError("Could not verify evaluation templates.");
          return false;
        }

        stages.forEach(stage => {
          if (stage.step_type === 'review' && stage.evaluation_template_id) {
            const templateCriteria = (allCriteria as EvaluationCriterion[]).filter(c => c.template_id === stage.evaluation_template_id);
            const { publishable: templateIsPublishable } = isEvaluationTemplatePublishable(templateCriteria);
            if (!templateIsPublishable) {
              isFullyPublishable = false;
              combinedErrors.set(stage.id, `Attached evaluation template is incomplete.`);
            }
          }
        });
      }

      if (!isFullyPublishable) {
        const errorMessages = Array.from(combinedErrors.entries()).map(([stageId, message]: [string, string]) => {
          const stageName = stages.find(s => s.id === stageId)?.name || 'A stage';
          return `• '${stageName}': ${message}`;
        }).join('\n');
        showError(`Cannot publish workflow. Please fix the following issues:\n${errorMessages}`, {
          duration: 10000,
        });
        return false;
      }
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('workflow_templates')
      .update({ status: newStatus, last_edited_by_user_id: user.id, last_edited_at: now, updated_at: now })
      .eq('id', templateId);

    if (error) {
      showError(`Failed to update status: ${error.message}`);
      return false;
    } else {
      showSuccess(`Template status updated to "${newStatus}".`);
      if (fetchTemplates) fetchTemplates();
      return true;
    }
  };

  const handleUpdateTemplateDetails = async (templateId: string, name: string, description: string | null) => {
    if (!user) return false;
    setIsSubmitting(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('workflow_templates')
      .update({ name, description, last_edited_by_user_id: user.id, last_edited_at: now, updated_at: now })
      .eq('id', templateId);

    setIsSubmitting(false);
    if (error) {
      showError(`Failed to update details: ${error.message}`);
      return false;
    }
    return true;
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

  const handleUpdateStageOrder = async (updates: WorkflowStage[]) => {
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

  const handleDuplicateTemplate = async (templateId: string, newTemplateName: string) => {
    if (!user) {
      showError("You must be logged in to duplicate a template.");
      return false;
    }
    
    const { data: originalTemplate, error: fetchError } = await supabase.from('workflow_templates').select('*').eq('id', templateId).single();
    if (fetchError || !originalTemplate) {
      showError("Could not find the original template to copy.");
      return false;
    }

    const now = new Date().toISOString();
    const { data: newTemplate, error: insertTemplateError } = await supabase.from('workflow_templates').insert({
        user_id: user.id,
        name: newTemplateName,
        description: originalTemplate.description,
        status: 'draft',
        last_edited_by_user_id: user.id,
        last_edited_at: now,
        updated_at: now,
    }).select('id').single();
    if (insertTemplateError || !newTemplate) {
      showError(`Failed to create new template: ${insertTemplateError.message}`);
      return false;
    }

    const { data: originalSteps, error: stepsError } = await supabase.from('workflow_steps').select('*').eq('workflow_template_id', templateId);
    if (stepsError) {
      showError(`Failed to copy stages: ${stepsError.message}`);
      await supabase.from('workflow_templates').delete().eq('id', newTemplate.id);
      return false;
    }

    if (originalSteps && originalSteps.length > 0) {
        const newSteps = originalSteps.map(step => {
            const { id, workflow_template_id, created_at, ...rest } = step;
            return {
                ...rest,
                workflow_template_id: newTemplate.id,
                last_edited_by_user_id: user.id,
                last_edited_at: now,
            };
        });
        const { error: insertStepsError } = await supabase.from('workflow_steps').insert(newSteps);
        if (insertStepsError) {
          showError(`Failed to insert copied stages: ${insertStepsError.message}`);
          await supabase.from('workflow_templates').delete().eq('id', newTemplate.id);
          return false;
        }
    }

    showSuccess("Template duplicated successfully!");
    if (fetchTemplates) fetchTemplates();
    navigate(`/creator/workflows/${newTemplate.id}/edit`);
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
    handleDuplicateTemplate,
  };
};