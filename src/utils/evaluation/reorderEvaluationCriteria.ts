import { EvaluationCriterion, EvaluationSection } from "@/types";

export const reorderEvaluationCriteria = (
  currentCriteria: EvaluationCriterion[],
  activeCriterionId: string,
  overId: string,
  sections: EvaluationSection[]
) => {
  const activeCriterion = currentCriteria.find(c => c.id === activeCriterionId);
  if (!activeCriterion) {
    return { updatedCriteria: currentCriteria, updatesToSend: [] };
  }

  let newSectionId: string | null = null;
  let newIndexInTargetSection: number = -1;

  // Determine the target section ID based on where the item was dropped
  if (sections.some(s => s.id === overId)) {
    newSectionId = overId; // Dropped directly onto a section header
  } else if (overId === 'uncategorized-criteria-droppable-area') {
    newSectionId = null; // Dropped onto the uncategorized droppable area
  } else {
    const overCriterion = currentCriteria.find(c => c.id === overId);
    if (overCriterion) {
      newSectionId = overCriterion.section_id; // Dropped onto another criterion, so it stays in that criterion's section
    } else {
      // Fallback: if overId is not a known section or criterion, keep it in its original section
      newSectionId = activeCriterion.section_id;
    }
  }

  // Create a new array for the updated criteria to avoid direct mutation issues
  let updatedCriteria = currentCriteria.map(c => ({ ...c }));

  // Remove the active criterion from its current position in the array
  updatedCriteria = updatedCriteria.filter(c => c.id !== activeCriterionId);

  // Filter criteria that belong to the target section (excluding the moved one for now)
  const targetSectionCriteria = updatedCriteria
    .filter(c => c.section_id === newSectionId)
    .sort((a, b) => a.order - b.order);

  // Determine the insertion index within the target section's sorted list
  const overCriterionIndex = targetSectionCriteria.findIndex(c => c.id === overId);
  if (overCriterionIndex !== -1) {
    newIndexInTargetSection = overCriterionIndex;
  } else {
    // If dropped into an empty section or at the very end of a section/uncategorized list
    newIndexInTargetSection = targetSectionCriteria.length;
  }

  // Insert the moved criterion into its new position in the target section's list
  const movedCriterionWithNewSection: EvaluationCriterion = { ...activeCriterion, section_id: newSectionId };
  targetSectionCriteria.splice(newIndexInTargetSection, 0, movedCriterionWithNewSection);

  // Re-calculate orders for all criteria in the target section
  const reorderedTargetSection: EvaluationCriterion[] = targetSectionCriteria.map((c, idx) => ({ ...c, order: idx + 1 }));

  // Reconstruct the full list of criteria by combining other criteria with the reordered target section
  const otherCriteria: EvaluationCriterion[] = updatedCriteria.filter(c => c.section_id !== newSectionId);
  const finalUpdatedCriteria: EvaluationCriterion[] = [...otherCriteria, ...reorderedTargetSection];

  // Prepare batch update for Supabase, including only criteria whose order or section_id has changed
  const updatesToSend: EvaluationCriterion[] = finalUpdatedCriteria.filter(c => {
    const originalCriterion = currentCriteria.find(orig => orig.id === c.id);
    return originalCriterion && (originalCriterion.order !== c.order || originalCriterion.section_id !== c.section_id);
  }).map(c => {
    const originalCriterion = currentCriteria.find(orig => orig.id === c.id);
    // Return the full original object with updated order and section_id
    return {
      ...originalCriterion!, 
      order: c.order,
      section_id: c.section_id,
    };
  });

  return { updatedCriteria: finalUpdatedCriteria, updatesToSend };
};