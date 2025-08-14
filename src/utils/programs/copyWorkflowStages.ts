import { supabase } from '@/integrations/supabase/client';
import { WorkflowStage } from '@/types';

/**
 * Copies workflow steps from a given workflow template to a specific program's stages.
 *
 * @param workflowTemplateId The ID of the workflow template to copy from.
 * @param programId The ID of the program to copy stages to.
 * @param userId The ID of the user performing the action (for last_edited_by_user_id).
 * @returns A boolean indicating success or failure.
 */
export const copyWorkflowStages = async (
  workflowTemplateId: string,
  programId: string,
  userId: string
): Promise<boolean> => {
  const now = new Date().toISOString();

  // Fetch all steps from the selected workflow template
  const { data: templateSteps, error: stepsError } = await supabase
    .from('workflow_steps')
    .select('name, order_index, step_type, description, form_id, email_template_id, evaluation_template_id')
    .eq('workflow_template_id', workflowTemplateId)
    .order('order_index', { ascending: true });

  if (stepsError) {
    console.error("Error fetching workflow steps for copying:", stepsError);
    return false;
  }

  if (!templateSteps || templateSteps.length === 0) {
    // No steps to copy, consider it a success for an empty template
    return true;
  }

  // Prepare new program_stages records
  const newProgramStages = templateSteps.map(step => ({
    program_id: programId,
    name: step.name,
    order: step.order_index, // Map order_index from template to order in program_stages
    step_type: step.step_type,
    description: step.description,
    form_id: step.form_id,
    email_template_id: step.email_template_id,
    evaluation_template_id: step.evaluation_template_id,
    created_at: now, // Set creation time for the new stage
  }));

  // Insert the new program_stages
  const { error: insertError } = await supabase
    .from('program_stages')
    .insert(newProgramStages);

  if (insertError) {
    console.error("Error inserting copied program stages:", insertError);
    return false;
  }

  return true;
};