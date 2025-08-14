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

  let targetSectionId: string | null = null;
  let overCriterion: EvaluationCriterion | undefined;

  if (sections.some(s => s.id === overId)) {
    targetSectionId = overId;
  } else if (overId === 'uncategorized-criteria-droppable-area') {
    targetSectionId = null;
  } else {
    overCriterion = currentCriteria.find(c => c.id === overId);
    if (overCriterion) {
      targetSectionId = overCriterion.section_id;
    } else {
      targetSectionId = activeCriterion.section_id;
    }
  }

  const mutableCriteria = [...currentCriteria];
  const activeCriterionIndex = mutableCriteria.findIndex(c => c.id === activeCriterionId);
  if (activeCriterionIndex === -1) {
    return { updatedCriteria: currentCriteria, updatesToSend: [] };
  }
  const [movedCriterion] = mutableCriteria.splice(activeCriterionIndex, 1);
  movedCriterion.section_id = targetSectionId;

  let insertIndex = -1;
  if (overCriterion) {
    const criteriaInTargetSection = mutableCriteria.filter(c => c.section_id === targetSectionId).sort((a, b) => a.order - b.order);
    insertIndex = criteriaInTargetSection.findIndex(c => c.id === overId);
    if (insertIndex !== -1) {
      criteriaInTargetSection.splice(insertIndex, 0, movedCriterion);
      mutableCriteria.splice(0, mutableCriteria.length, ...mutableCriteria.filter(c => c.section_id !== targetSectionId), ...criteriaInTargetSection);
    } else {
      mutableCriteria.push(movedCriterion);
    }
  } else {
    mutableCriteria.push(movedCriterion);
  }

  const allContainerIds = new Set([...sections.map(s => s.id), null]);
  let finalUpdatedCriteria: EvaluationCriterion[] = [];
  allContainerIds.forEach(containerId => {
    const currentContainerCriteria = mutableCriteria.filter(c => c.section_id === containerId).sort((a, b) => a.order - b.order);
    const updatedContainerCriteria = currentContainerCriteria.map((c, idx) => ({ ...c, order: idx + 1 }));
    finalUpdatedCriteria = finalUpdatedCriteria.concat(updatedContainerCriteria);
  });

  const updatesToSend: Partial<EvaluationCriterion>[] = finalUpdatedCriteria.filter(c => {
    const originalCriterion = currentCriteria.find(orig => orig.id === c.id);
    return originalCriterion && (originalCriterion.order !== c.order || originalCriterion.section_id !== c.section_id);
  }).map(c => ({
    id: c.id,
    order: c.order,
    section_id: c.section_id,
  }));

  return { updatedCriteria: finalUpdatedCriteria, updatesToSend };
};