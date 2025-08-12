import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowStep } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

interface UseWorkflowStepDragAndDropProps {
  workflowSteps: WorkflowStep[];
  setWorkflowSteps: React.Dispatch<React.SetStateAction<WorkflowStep[]>>;
  fetchData: () => Promise<void>;
}

export const useWorkflowStepDragAndDrop = ({ workflowSteps, setWorkflowSteps, fetchData }: UseWorkflowStepDragAndDropProps) => {
  const [activeDragItem, setActiveDragItem] = useState<WorkflowStep | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = useCallback((event: any) => {
    if (event.active.data.current?.type === "WorkflowStep") {
      setActiveDragItem(event.active.data.current.step);
    }
  }, []);

  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeStepId = active.id as string;
    const overStepId = over.id as string;

    const oldIndex = workflowSteps.findIndex(step => step.id === activeStepId);
    const newIndex = workflowSteps.findIndex(step => step.id === overStepId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderedSteps = arrayMove(workflowSteps, oldIndex, newIndex);

    // Optimistic update
    setWorkflowSteps(newOrderedSteps);

    // Prepare batch update for Supabase
    const updatesToSend: { id: string; order_index: number; }[] = newOrderedSteps.map((step, idx) => ({
      id: step.id,
      order_index: idx + 1, // Orders are 1-based
    }));

    const { error } = await supabase.from('workflow_steps').upsert(updatesToSend);
    if (error) {
      showError(`Failed to save step order: ${error.message}. Reverting.`);
      fetchData(); // Re-fetch to ensure full consistency after error
    } else {
      showSuccess("Workflow step order updated successfully.");
      fetchData(); // Re-fetch data to ensure full consistency after successful DB update
    }
  }, [workflowSteps, setWorkflowSteps, fetchData]);

  return {
    sensors,
    onDragStart,
    onDragEnd,
    activeDragItem,
  };
};