import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { FormSection } from '@/types';
import { showError, showSuccess } from '@/utils/toast';
import { reorderFormSections } from '@/utils/reorderFormSections';

interface UseFormSectionDragAndDropProps {
  sections: FormSection[];
  setSections: React.Dispatch<React.SetStateAction<FormSection[]>>;
  fetchData: () => Promise<void>;
}

export const useFormSectionDragAndDrop = ({ sections, setSections, fetchData }: UseFormSectionDragAndDropProps) => {
  const [activeDragItem, setActiveDragItem] = useState<FormSection | null>(null);

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

    const activeSectionId = active.id as string;
    const overSectionId = over.id as string;

    // Ensure both active and over items are sections
    if (active.data.current?.type !== "Section" || over.data.current?.type !== "Section") {
      return;
    }

    const { updatedSections, updatesToSend } = reorderFormSections(sections, activeSectionId, overSectionId);

    if (updatesToSend.length > 0) {
      // Optimistic update
      setSections(updatedSections);

      const { error } = await supabase.from('form_sections').upsert(updatesToSend);
      if (error) {
        showError(`Failed to save section order: ${error.message}. Reverting.`);
        fetchData(); // Re-fetch to ensure full consistency after error
      } else {
        showSuccess("Section order updated successfully.");
        fetchData(); // Re-fetch data to ensure full consistency after successful DB update
      }
    }
  }, [sections, setSections, fetchData]);

  return {
    sensors,
    onDragStart,
    onDragEnd,
    activeDragItem,
  };
};