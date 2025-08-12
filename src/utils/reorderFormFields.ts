import { FormField, FormSection } from "@/types";

/**
 * Calculates the new order and section assignments for form fields after a drag-and-drop operation.
 * @param currentFields The current array of all form fields.
 * @param activeFieldId The ID of the field being dragged.
 * @param overId The ID of the element the field was dropped over (can be a field or a section).
 * @param sections The array of all form sections.
 * @returns An object containing:
 *   - `updatedFields`: The new array of fields with updated orders and section IDs.
 *   - `updatesToSend`: An array of objects ready for Supabase upsert, containing only changed fields.
 */
export const reorderFormFields = (
  currentFields: FormField[],
  activeFieldId: string,
  overId: string,
  sections: FormSection[]
) => {
  const activeField = currentFields.find(f => f.id === activeFieldId);
  if (!activeField) {
    return { updatedFields: currentFields, updatesToSend: [] };
  }

  let targetSectionId: string | null = null;
  let overField: FormField | undefined;

  // Determine target section ID and if dropped over a field or a section
  if (sections.some(s => s.id === overId)) {
    targetSectionId = overId; // Dropped directly onto a section header
  } else if (overId === 'uncategorized-fields-droppable-area') {
    targetSectionId = null; // Dropped onto the uncategorized droppable area
  } else {
    overField = currentFields.find(f => f.id === overId);
    if (overField) {
      targetSectionId = overField.section_id; // Dropped onto another field
    } else {
      // Fallback if overId is not a known section or field (e.g., dropped into empty space within a section)
      // In this case, try to infer the section from the active field's original section, or keep it null
      targetSectionId = activeField.section_id;
    }
  }

  // Create a mutable copy of fields for reordering
  const mutableFields = [...currentFields];

  // Remove the active field from its current position
  const activeFieldIndex = mutableFields.findIndex(f => f.id === activeFieldId);
  if (activeFieldIndex === -1) {
    return { updatedFields: currentFields, updatesToSend: [] };
  }
  const [movedField] = mutableFields.splice(activeFieldIndex, 1);

  // Update the moved field's section_id
  movedField.section_id = targetSectionId;

  // Find the insertion index within the target section
  let insertIndex = -1;
  if (overField) {
    // If dropped over a specific field, insert before it
    const fieldsInTargetSection = mutableFields.filter(f => f.section_id === targetSectionId).sort((a, b) => a.order - b.order);
    insertIndex = fieldsInTargetSection.findIndex(f => f.id === overId);
    if (insertIndex !== -1) {
      // Insert the moved field into the correct position in the filtered list
      fieldsInTargetSection.splice(insertIndex, 0, movedField);
      // Replace the original fields in mutableFields with the reordered ones for this section
      mutableFields.splice(0, mutableFields.length, ...mutableFields.filter(f => f.section_id !== targetSectionId), ...fieldsInTargetSection);
    } else {
      // If overField was found but not in the filtered list (e.g., already moved), add to end of section
      mutableFields.push(movedField);
    }
  } else {
    // If dropped onto a section header or uncategorized area, add to the end of that section
    mutableFields.push(movedField);
  }

  // Recalculate orders for all fields in all affected sections (and uncategorized)
  const allContainerIds = new Set([...sections.map(s => s.id), null]); // null for uncategorized

  let finalUpdatedFields: FormField[] = [];
  allContainerIds.forEach(containerId => {
    const currentContainerFields = mutableFields
      .filter(f => f.section_id === containerId)
      .sort((a, b) => a.order - b.order); // Sort by current order to get correct index

    const updatedContainerFields = currentContainerFields.map((f, idx) => ({ ...f, order: idx + 1 }));
    finalUpdatedFields = finalUpdatedFields.concat(updatedContainerFields);
  });

  // Prepare batch update for Supabase
  const updatesToSend: { id: string; order: number; section_id: string | null; }[] = finalUpdatedFields.filter(f => {
    const originalField = currentFields.find(orig => orig.id === f.id);
    return originalField && (originalField.order !== f.order || originalField.section_id !== f.section_id);
  }).map(f => ({
    id: f.id,
    order: f.order,
    section_id: f.section_id,
  }));

  return { updatedFields: finalUpdatedFields, updatesToSend };
};