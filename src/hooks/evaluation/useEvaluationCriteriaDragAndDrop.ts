import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { EvaluationCriterion, EvaluationSection } from '@/types';
import { showError, showSuccess } from '@/utils/toast';
import { reorderEvaluationCriteria } from '@/utils/evaluation/reorderEvaluationCriteria';
import { useSession } from '@/contexts/auth/SessionContext';

interface UseEvaluationCriteriaDragAndDropProps {
  criteria: EvaluationCriterion[];
  setCriteria: React.Dispatch<React.SetStateAction<EvaluationCriterion[]>>;
  sections: EvaluationSection[];
  fetchData: () => Promise<void>;
}

export const useEvaluationCriteriaDragAndDrop = ({ criteria, setCriteria, sections, fetchData }: UseEvaluationCriteriaDragAndDropProps) => {
  const [activeDragItem, setActiveDragItem] = useState<EvaluationCriterion | null>(null);
  const { user } = useSession();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = useCallback((event: any) => {
    if (event.active.data.current?.criterion) {
      setActiveDragItem(event.active.data.current.criterion);
    }
  }, []);

  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || !user) return;

    const activeCriterionId = active.id as string;
    const overId = over.id as string;

    const { updatedCriteria, updatesToSend } = reorderEvaluationCriteria(criteria, activeCriterionId, overId, sections);

    if (updatesToSend.length > 0) {
      // Add last_edited_by_user_id and last_edited_at to each updated criterion
      const updatesWithMetadata = updatesToSend.map(criterion => ({
        ...criterion,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
      }));

      setCriteria(updatedCriteria); // Optimistic update
      const { error } = await supabase.from('evaluation_criteria').upsert(updatesWithMetadata);
      if (error) {
        showError(`Failed to save changes: ${error.message}. Reverting.`);
        fetchData(); // Revert by re-fetching
      } else {
        showSuccess("Criteria updated successfully.");
        fetchData(); // Re-fetch to ensure full consistency
      }
    }
  }, [criteria, sections, setCriteria, fetchData, user]);

  return { sensors, onDragStart, onDragEnd, activeDragItem };
};