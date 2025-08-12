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

  const originalFields = [...currentFields];
  let tempFields = [...currentFields];

  // Remove the active field from its current position in tempFields
  tempFields = tempFields.filter(f => f.id !== activeFieldId);

  let targetSectionId: string | null = null;
  let insertIndex = -1;

  // Determine target section ID and insertion index
  if (sections.some(s => s.id === overId)) {
    targetSectionId = overId; // Dropped directly onto a section header
    insertIndex = tempFields.filter(f => f.section_id === targetSectionId).length; // Insert at end of section
  } else if (overId === 'uncategorized-fields-droppable-area') {
    targetSectionId = null; // Dropped onto the uncategorized droppable area
    insertIndex = tempFields.filter(f => f.section_id === null).length; // Insert at end of uncategorized
  } else {
    const overField = currentFields.find(f => f.id === overId);
    if (overField) {
      targetSectionId = overField.section_id; // Dropped onto another field
      const fieldsInTargetSection = tempFields.filter(f => f.section_id === targetSectionId).sort((a, b) => a.order - b.order);
      insertIndex = fieldsInTargetSection.findIndex(f => f.id === overId);
    }
  }

  // Prepare the field to be moved/reordered
  const fieldToMove = { ...activeField, section_id: targetSectionId };

  // Insert the field into its new position in the temporary array
  if (insertIndex !== -1) {
    const fieldsInTargetSection = tempFields.filter(f => f.section_id === targetSectionId).sort((a, b) => a.order - b.order);
    fieldsInTargetSection.splice(insertIndex, 0, fieldToMove);
    tempFields = tempFields.filter(f => f.section_id !== targetSectionId); // Remove old versions from tempFields
    tempFields.push(...fieldsInTargetSection); // Add updated versions
  } else {
    // If no specific overId or dropped into an empty section, add to the end of the target section
    tempFields.push(fieldToMove);
  }

  // Recalculate orders for all fields in all affected sections (and uncategorized)
  const allContainerIds = new Set([...sections.map(s => s.id), null]); // null for uncategorized

  let finalUpdatedFields: FormField[] = []; // Re-initialize to ensure it's clean
  allContainerIds.forEach(containerId => {
    const currentContainerFields = tempFields
      .filter(f => f.section_id === containerId)
      .sort((a, b) => a.order - b.order); // Sort by current order to get correct index

    const updatedContainerFields = currentContainerFields.map((f, idx) => ({ ...f, order: idx + 1 }));

    // Instead of filtering and pushing, build the array directly
    finalUpdatedFields = finalUpdatedFields.concat(updatedContainerFields);
  });

  // Sort the final array by order to ensure correct display (across all sections)
  finalUpdatedFields.sort((a, b) => a.order - b.order);

  // Prepare batch update for Supabase
  const updatesToSend: { id: string; order: number; section_id: string | null; }[] = finalUpdatedFields.filter(f => {
    const originalField = originalFields.find(orig => orig.id === f.id);
    return originalField && (originalField.order !== f.order || originalField.section_id !== f.section_id);
  }).map(f => ({
    id: f.id,
    order: f.order,
    section_id: f.section_id,
  }));

  return { updatedFields: finalUpdatedFields, updatesToSend };
};