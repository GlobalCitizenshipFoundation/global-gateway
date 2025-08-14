import { FormSection } from "@/types";

/**
 * Calculates the new order for form sections after a drag-and-drop operation.
 * @param currentSections The current array of all form sections.
 * @param activeSectionId The ID of the section being dragged.
 * @param overId The ID of the section the active section was dropped over.
 * @returns An object containing:
 *   - `updatedSections`: The new array of sections with updated orders.
 *   - `updatesToSend`: An array of objects ready for Supabase upsert, containing only changed sections.
 */
export const reorderFormSections = (
  currentSections: FormSection[],
  activeSectionId: string,
  overId: string
) => {
  const activeSection = currentSections.find(s => s.id === activeSectionId);
  if (!activeSection) {
    return { updatedSections: currentSections, updatesToSend: [] };
  }

  const oldIndex = currentSections.findIndex(s => s.id === activeSectionId);
  const newIndex = currentSections.findIndex(s => s.id === overId);

  if (oldIndex === -1 || newIndex === -1) {
    return { updatedSections: currentSections, updatesToSend: [] };
  }

  const tempSections = [...currentSections];
  const [movedSection] = tempSections.splice(oldIndex, 1);
  tempSections.splice(newIndex, 0, movedSection);

  // Recalculate orders for all sections
  const updatedSections = tempSections.map((section, idx) => ({
    ...section,
    order: idx + 1,
  }));

  // Prepare batch update for Supabase, only including sections whose order has changed
  const updatesToSend: FormSection[] = updatedSections.filter(s => {
    const originalSection = currentSections.find(orig => orig.id === s.id);
    // Only include sections that actually changed order
    return originalSection && originalSection.order !== s.order;
  }).map(s => {
    // Find the original section to ensure all its properties are carried over
    const originalSection = currentSections.find(orig => orig.id === s.id);
    if (!originalSection) {
      // This should ideally not happen if the filter above is correct
      console.warn(`Original section not found for ID: ${s.id}`);
      return s; // Fallback to sending the current state of 's'
    }
    // Return the full updated section object
    return {
      ...originalSection, // Spread all original properties
      order: s.order, // Override with new order
    };
  });

  return { updatedSections, updatesToSend };
};