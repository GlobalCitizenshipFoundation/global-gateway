import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ProgramStage } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from "react"; // Explicit React import

const SortableStageItem = ({ stage, onDelete }: { stage: ProgramStage; onDelete: (stageId: string) => void; }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-secondary rounded-md gap-2">
      <div className="flex items-center gap-2 flex-grow">
        <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
        <span className="font-medium">{stage.name}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(stage.id)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </li>
  );
};

const ManageWorkflowPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [stages, setStages] = useState<ProgramStage[]>([]);
  const [programTitle, setProgramTitle] = useState<string>('');
  const [newStageName, setNewStageName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchWorkflow = useCallback(async (): Promise<void> => {
    if (!programId) return;
    setLoading(true);

    const { data: programData, error: programError } = await supabase
      .from('programs')
      .select('title')
      .eq('id', programId)
      .single();

    if (programError || !programData) {
      showError("Could not fetch program details.");
      setLoading(false);
      return;
    }
    setProgramTitle(programData.title);

    const { data: stagesData, error: stagesError } = await supabase
      .from('program_stages')
      .select('*')
      .eq('program_id', programId)
      .order('order', { ascending: true });

    if (stagesError) {
      showError("Could not fetch workflow stages.");
    } else {
      setStages(stagesData as ProgramStage[]);
    }
    setLoading(false);
  }, [programId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const handleAddStage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newStageName.trim() || !programId) return;

    setIsSubmitting(true);
    const nextOrder = stages.length > 0 ? Math.max(...stages.map((s: ProgramStage) => s.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('program_stages')
      .insert({
        program_id: programId,
        name: newStageName,
        order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add stage: ${error.message}`);
    } else if (data) {
      setStages([...stages, data as ProgramStage]);
      setNewStageName('');
      showSuccess("Stage added successfully.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteStage = async (stageId: string): Promise<void> => {
    const { error } = await supabase
      .from('program_stages')
      .delete()
      .eq('id', stageId);

    if (error) {
      showError(`Failed to delete stage: ${error.message}`);
    } else {
      setStages(stages.filter((s: ProgramStage) => s.id !== stageId));
      showSuccess("Stage deleted successfully.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s: ProgramStage) => s.id === active.id);
      const newIndex = stages.findIndex((s: ProgramStage) => s.id === over.id);
      const newOrderedStages = arrayMove(stages, oldIndex, newIndex);
      setStages(newOrderedStages);

      const updates = newOrderedStages.map((stage: ProgramStage, index: number) => ({
        id: stage.id,
        order: index + 1,
      }));

      const { error } = await supabase.from('program_stages').upsert(updates);
      if (error) {
        showError("Failed to save new order. Reverting.");
        fetchWorkflow();
      } else {
        showSuccess("Stage order saved.");
      }
    }
  };

  return (
    <div className="container py-12">
      <Link to="/creator/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Programs
      </Link>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Manage Workflow</CardTitle>
          <CardDescription>
            Define and reorder the stages for your program: <span className="font-semibold">{programTitle}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Stages</h3>
            {loading ? (
              <p>Loading stages...</p>
            ) : stages.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <ul className="space-y-4">
                  <SortableContext items={stages.map((s: ProgramStage) => s.id)} strategy={verticalListSortingStrategy}>
                    {stages.map((stage: ProgramStage) => (
                      <SortableStageItem key={stage.id} stage={stage} onDelete={handleDeleteStage} />
                    ))}
                  </SortableContext>
                </ul>
              </DndContext>
            ) : (
              <p className="text-muted-foreground text-sm">No stages defined yet. Add one to get started.</p>
            )}
          </div>
          <form onSubmit={handleAddStage} className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-medium">Add New Stage</h3>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="e.g., Final Review"
                value={newStageName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStageName(e.target.value)}
                disabled={isSubmitting}
              />
              <Button type="submit" disabled={isSubmitting || !newStageName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Stage
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageWorkflowPage;