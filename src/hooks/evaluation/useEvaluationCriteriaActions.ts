import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { EvaluationCriterion } from '@/types';

interface UseEvaluationCriteriaActionsProps {
  templateId: string | undefined;
  setCriteria: React.Dispatch<React.SetStateAction<EvaluationCriterion[]>>;
}

export const useEvaluationCriteriaActions = ({ templateId, setCriteria }: UseEvaluationCriteriaActionsProps) => {
  const { user } = useSession();

  const handleAddCriterion = async () => {
    if (!user || !templateId) {
      showError("Cannot add criterion: missing user or template ID.");
      return null;
    }

    const { data: existingCriteria, error: fetchError } = await supabase
      .from('evaluation_criteria')
      .select('order')
      .eq('template_id', templateId);

    if (fetchError) {
      showError("Could not determine order for new criterion.");
      return null;
    }

    const nextOrder = existingCriteria.length > 0 ? Math.max(...existingCriteria.map(c => c.order)) + 1 : 1;

    const { data: newCriterion, error } = await supabase
      .from('evaluation_criteria')
      .insert({
        template_id: templateId,
        label: "New Criterion",
        criterion_type: 'number_scale',
        order: nextOrder,
        weight: 1.0,
        min_score: 1,
        max_score: 5,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add criterion: ${error.message}`);
      return null;
    } else {
      setCriteria(prev => [...prev, newCriterion as EvaluationCriterion]);
      return newCriterion as EvaluationCriterion;
    }
  };

  const handleDeleteCriterion = async (criterionId: string) => {
    const { error } = await supabase
      .from('evaluation_criteria')
      .delete()
      .eq('id', criterionId);

    if (error) {
      showError(`Failed to delete criterion: ${error.message}`);
      return false;
    }
    return true;
  };

  const handleUpdateCriterion = async (criterionId: string, updates: Partial<EvaluationCriterion>) => {
    const { error } = await supabase
      .from('evaluation_criteria')
      .update(updates)
      .eq('id', criterionId);

    if (error) {
      showError(`Failed to update criterion: ${error.message}`);
      return false;
    }
    return true;
  };

  const handleUpdateCriteriaOrder = async (orderedCriteria: EvaluationCriterion[]) => {
    const updates = orderedCriteria.map((criterion, index) => ({
      id: criterion.id,
      order: index + 1,
    }));

    const { error } = await supabase
      .from('evaluation_criteria')
      .upsert(updates);

    if (error) {
      showError(`Failed to save new order: ${error.message}`);
      return false;
    }
    return true;
  };

  return {
    handleAddCriterion,
    handleDeleteCriterion,
    handleUpdateCriterion,
    handleUpdateCriteriaOrder,
  };
};