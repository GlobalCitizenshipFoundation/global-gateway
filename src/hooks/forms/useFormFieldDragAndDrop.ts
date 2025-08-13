import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection } from '@/types';
import { showError, showSuccess } from '@/utils/toast';
import { reorderFormFields } from '@/utils/forms/reorderFormFields'; // Import the new utility
import { useSession } from '@/contexts/auth/SessionContext'; // Import useSession

interface UseFormFieldDragAndDropProps {
  fields: FormField[];
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  sections: FormSection[];
  fetchData: () => Promise<void>;
}

export const useFormFieldDragAndDrop = ({ fields, setFields, sections, fetchData }: UseFormFieldDragAndDropProps) => {
  const [activeDragItem, setActiveDragItem] = useState<FormField | null>(null);
  const { user } = useSession(); // Get the current user

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = useCallback((event: any) => {
    if (event.active.data.current?.field) {
      setActiveDragItem(event.active.data.current.field);
    }
  }, []);

  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;

    if (!over || !user) return; // Ensure user is logged in

    const activeFieldId = active.id as string;
    const overId = over.id as string;

    // Use the new utility function to calculate updates
    const { updatedFields, updatesToSend } = reorderFormFields(fields, activeFieldId, overId, sections);

    if (updatesToSend.length > 0) {
      // Add last_edited_by_user_id and last_edited_at to each updated field
      const updatesWithMetadata = updatesToSend.map(field => ({
        ...field,
        last_edited_by_user_id: user.id,
        last_edited_at: new Date().toISOString(),
      }));

      // Optimistic update
      setFields(updatedFields);

      const { error } = await supabase.from('form_fields').upsert(updatesWithMetadata);
      if (error) {
        showError(`Failed to save changes: ${error.message}. Reverting.`);
        // Revert to original state by re-fetching or using a stored original state
        fetchData(); // Re-fetch to ensure full consistency after error
      } else {
        showSuccess("Field(s) updated successfully.");
        // Re-fetch data to ensure full consistency after successful DB update
        fetchData();
      }
    }
  }, [fields, sections, setFields, fetchData, user]);

  return {
    sensors,
    onDragStart,
    onDragEnd,
    activeDragItem,
  };
};