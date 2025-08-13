import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useWorkflowBuilderData } from "@/hooks/workflow/useWorkflowBuilderData";
import { useWorkflowTemplateActions } from "@/hooks/workflow/useWorkflowTemplateActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { WorkflowStepCard } from "@/components/workflow/WorkflowStepCard";
import { showSuccess } from "@/utils/toast";

const WorkflowBuilderPage = () => {
  const { workflowId, template, setTemplate, steps, setSteps, loading, fetchData } = useWorkflowBuilderData();
  const { isSubmitting, handleUpdateTemplateDetails, handleAddStep, handleDeleteStep, handleUpdateStepOrder } = useWorkflowTemplateActions({});

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
    }
  }, [template]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSaveDetails = () => {
    if (workflowId) {
      handleUpdateTemplateDetails(workflowId, name, description);
    }
  };

  const addNewStep = async () => {
    if (workflowId) {
      const newStep = await handleAddStep(workflowId, steps);
      if (newStep) {
        setSteps(prev => [...prev, newStep]);
        showSuccess("New step added.");
      }
    }
  };

  const deleteStep = async (stepId: string) => {
    const success = await handleDeleteStep(stepId);
    if (success) {
      setSteps(prev => prev.filter(s => s.id !== stepId));
      showSuccess("Step deleted.");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex(s => s.id === active.id);
      const newIndex = steps.findIndex(s => s.id === over.id);
      const newOrderedSteps = arrayMove(steps, oldIndex, newIndex);
      setSteps(newOrderedSteps);

      const updates = newOrderedSteps.map((step, index) => ({
        id: step.id,
        order_index: index + 1,
      }));
      handleUpdateStepOrder(updates);
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Link to="/creator/workflows" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Workflows
      </Link>
      
      <Card className="mx-auto max-w-3xl mb-8">
        <CardHeader>
          <CardTitle>Workflow Settings</CardTitle>
          <CardDescription>Define the name and description for this workflow template.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow Name" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Workflow Description (optional)" />
          <Button onClick={handleSaveDetails} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Details"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Workflow Steps</CardTitle>
          <CardDescription>Add and arrange the steps for this workflow. Drag to reorder.</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {steps.map(step => (
                <WorkflowStepCard key={step.id} step={step} onDelete={deleteStep} />
              ))}
            </SortableContext>
          </DndContext>
          {steps.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No steps yet. Add one to get started.</p>
          )}
          <Button variant="outline" className="w-full mt-4" onClick={addNewStep}>
            <Plus className="mr-2 h-4 w-4" /> Add Step
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowBuilderPage;