import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { EvaluationCriterion, EvaluationSection } from '@/types';

interface UseEvaluationCriteriaActionsProps {
  templateId: string | undefined;
  setCriteria: React.Dispatch<React.SetStateAction<EvaluationCriterion[]>>;
  setSections: React.Dispatch<React.SetStateAction<EvaluationSection[]>>;
}

export const useEvaluationCriteriaActions = ({ templateId, setCriteria, setSections }: UseEvaluationCriteriaActionsProps) => {
  const { user } = useSession();

  const handleAddCriterion = async (sectionId: string | null) => {
    if (!user || !templateId) {
      showError("Cannot add criterion: missing user or template ID.");
      return null;
    }

    let query = supabase
      .from('evaluation_criteria')
      .select('order')
      .eq('template_id', templateId);

    if (sectionId === null) {
      query = query.is('section_id', null);
    } else {
      query = query.eq('section_id', sectionId);
    }

    const { data: existingCriteria, error: fetchError } = await query;

    if (fetchError) {
      showError("Could not determine order for new criterion.");
      return null;
    }

    const nextOrder = existingCriteria.length > 0 ? Math.max(...existingCriteria.map(c => c.order)) + 1 : 1;

    const { data: newCriterion, error } = await supabase
      .from('evaluation_criteria')
      .insert({
        template_id: templateId,
        section_id: sectionId,
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
      section_id: criterion.section_id,
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

  const handleAddSection = async (name: string, description: string | null) => {
    if (!user || !templateId) return null;
    const { data: existingSections, error: fetchError } = await supabase.from('evaluation_sections').select('order').eq('template_id', templateId);
    if (fetchError) { showError("Could not determine order for new section."); return null; }
    const nextOrder = existingSections.length > 0 ? Math.max(...existingSections.map(s => s.order)) + 1 : 1;
    const { data, error } = await supabase.from('evaluation_sections').insert({ template_id: templateId, name, description, order: nextOrder }).select().single();
    if (error) { showError(`Failed to add section: ${error.message}`); return null; }
    setSections(prev => [...prev, data as EvaluationSection]);
    return data as EvaluationSection;
  };

  const handleDeleteSection = async (sectionId: string) => {
    const { error } = await supabase.from('evaluation_sections').delete().eq('id', sectionId);
    if (error) { showError(`Failed to delete section: ${error.message}`); return false; }
    return true;
  };

  const handleUpdateSection = async (sectionId: string, updates: Partial<EvaluationSection>) => {
    const { error } = await supabase.from('evaluation_sections').update(updates).eq('id', sectionId);
    if (error) { showError(`Failed to update section: ${error.message}`); return false; }
    return true;
  };

  return {
    handleAddCriterion,
    handleDeleteCriterion,
    handleUpdateCriterion,
    handleUpdateCriteriaOrder,
    handleAddSection,
    handleDeleteSection,
    handleUpdateSection,
  };
};