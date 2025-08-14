import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { EvaluationSection } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

interface UseEvaluationSectionDragAndDropProps {
  sections: EvaluationSection[];
  setSections: React.Dispatch<React.SetStateAction<EvaluationSection[]>>;
  fetchData: () => Promise<void>;
}

export const useEvaluationSectionDragAndDrop = ({ sections, setSections, fetchData }: UseEvaluationSectionDragAndDropProps) => {
  const [activeDragItem, setActiveDragItem] = useState<EvaluationSection | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = useCallback((event: any) => {
    if (event.active.data.current?.type === "Section") {
      setActiveDragItem(event.active.data.current.section);
    }
  }, []);

  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const updatedSections = arrayMove(sections, oldIndex, newIndex).map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(updatedSections);

    const updatesToSend = updatedSections.map(s => ({ id: s.id, order: s.order }));

    const { error } = await supabase.from('evaluation_sections').upsert(updatesToSend);
    if (error) {
      showError(`Failed to save section order: ${error.message}. Reverting.`);
      fetchData();
    } else {
      showSuccess("Section order updated successfully.");
    }
  }, [sections, setSections, fetchData]);

  return { sensors, onDragStart, onDragEnd, activeDragItem };
};