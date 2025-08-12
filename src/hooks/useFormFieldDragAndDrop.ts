import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { FormField, FormSection } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

interface UseFormFieldDragAndDropProps {
  fields: FormField[];
  setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
  sections: FormSection[];
  fetchData: () => Promise<void>;
}

export const useFormFieldDragAndDrop = ({ fields, setFields, sections, fetchData }: UseFormFieldDragAndDropProps) => {
  const [activeDragItem, setActiveDragItem] = useState<FormField | null>(null);

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

    if (!over) return;

    const activeFieldId = active.id as string;
    const overId = over.id as string;

    const activeField = fields.find(f => f.id === activeFieldId);
    if (!activeField) return;

    const sourceSectionId = activeField.section_id;
    let targetSectionId: string | null = null;

    // Determine target section ID
    if (sections.some(s => s.id === overId)) {
      targetSectionId = overId; // Dropped directly onto a section header
    } else if (overId === 'uncategorized-fields-droppable-area') {
      targetSectionId = null; // Dropped onto the uncategorized droppable area
    } else if (over.data.current?.field) {
      targetSectionId = over.data.current.field.section_id; // Dropped onto another field
    } else {
      return; // No valid drop target found
    }

    // If no effective change in section or order, do nothing.
    // This check is more robust after determining targetSectionId
    if (sourceSectionId === targetSectionId) {
      const currentSectionFields = fields.filter(f => f.section_id === sourceSectionId).sort((a, b) => a.order - b.order);
      const oldIndex = currentSectionFields.findIndex(f => f.id === activeFieldId);
      const newIndex = currentSectionFields.findIndex(f => f.id === overId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return; // No actual reorder happened
      }
    }

    const originalFields = [...fields]; // Store for potential revert
    let updatedFields: FormField[] = [];
    let updatesToSend: { id: string; order: number; section_id: string | null; }[] = [];

    // Create a mutable copy of fields for local manipulation
    let tempFields = [...fields];

    // Remove the active field from its current position in tempFields
    tempFields = tempFields.filter(f => f.id !== activeFieldId);

    // Find the index where the active field should be inserted in the target section
    let insertIndex = -1;
    if (over.data.current?.field) {
      insertIndex = tempFields.filter(f => f.section_id === targetSectionId).findIndex(f => f.id === overId);
    }
    
    // Prepare the field to be moved/reordered
    const fieldToMove = { ...activeField, section_id: targetSectionId };

    // Insert the field into its new position in the temporary array
    if (insertIndex !== -1) {
      const fieldsInTargetSection = tempFields.filter(f => f.section_id === targetSectionId).sort((a, b) => a.order - b.order);
      fieldsInTargetSection.splice(insertIndex, 0, fieldToMove);
      tempFields = tempFields.filter(f => f.section_id !== targetSectionId);
      tempFields.push(...fieldsInTargetSection);
    } else {
      // If no specific overId or dropped into an empty section, add to the end of the target section
      tempFields.push(fieldToMove);
    }

    // Recalculate orders for all fields in all affected sections
    const allContainerIds = new Set([...sections.map(s => s.id), null]); // null for uncategorized
    
    allContainerIds.forEach(containerId => {
      const currentContainerFields = tempFields
        .filter(f => f.section_id === containerId)
        .sort((a, b) => a.order - b.order); // Sort by current order to get correct index

      const updatedContainerFields = currentContainerFields.map((f, idx) => ({ ...f, order: idx + 1 }));

      updatedFields = updatedFields.filter(f => f.section_id !== containerId); // Remove old versions
      updatedFields.push(...updatedContainerFields); // Add new versions
    });

    // Sort the final array by order to ensure correct display
    updatedFields.sort((a, b) => a.order - b.order);

    // Prepare batch update for Supabase
    updatesToSend = updatedFields.filter(f => {
      const originalField = originalFields.find(orig => orig.id === f.id);
      return originalField && (originalField.order !== f.order || originalField.section_id !== f.section_id);
    }).map(f => ({
      id: f.id,
      order: f.order,
      section_id: f.section_id,
    }));

    if (updatesToSend.length > 0) {
      // Optimistic update
      setFields(updatedFields);

      const { error } = await supabase.from('form_fields').upsert(updatesToSend);
      if (error) {
        showError(`Failed to save changes: ${error.message}. Reverting.`);
        setFields(originalFields); // Revert on error
      } else {
        showSuccess("Field(s) updated successfully.");
        // Re-fetch data to ensure full consistency after successful DB update
        fetchData();
      }
    }
  }, [fields, sections, setFields, fetchData]);

  return {
    sensors,
    onDragStart,
    onDragEnd,
    activeDragItem,
  };
};