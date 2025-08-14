import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { EvaluationCriterion, EvaluationSection } from '@/types';
import { showError, showSuccess } from '@/utils/toast';
import { reorderEvaluationCriteria } from '@/utils/evaluation/reorderEvaluationCriteria';

interface UseEvaluationCriteriaDragAndDropProps {
  criteria: EvaluationCriterion[];
  setCriteria: React.Dispatch<React.SetStateAction<EvaluationCriterion[]>>;
  sections: EvaluationSection[];
  fetchData: () => Promise<void>;
}

export const useEvaluationCriteriaDragAndDrop = ({ criteria, setCriteria, sections, fetchData }: UseEvaluationCriteriaDragAndDropProps) => {
  const [activeDragItem, setActiveDragItem] = useState<EvaluationCriterion | null>(null);

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
    if (!over) return;

    const activeCriterionId = active.id as string;
    const overId = over.id as string;

    const { updatedCriteria, updatesToSend } = reorderEvaluationCriteria(criteria, activeCriterionId, overId, sections);

    if (updatesToSend.length > 0) {
      setCriteria(updatedCriteria);
      const { error } = await supabase.from('evaluation_criteria').upsert(updatesToSend);
      if (error) {
        showError(`Failed to save changes: ${error.message}. Reverting.`);
        fetchData();
      } else {
        showSuccess("Criteria updated successfully.");
      }
    }
  }, [criteria, sections, setCriteria, fetchData]);

  return { sensors, onDragStart, onDragEnd, activeDragItem };
};