import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useEvaluationTemplateBuilderData } from "@/hooks/evaluation/useEvaluationTemplateBuilderData";
import { useEvaluationCriteriaActions } from "@/hooks/evaluation/useEvaluationCriteriaActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CriterionCard } from "@/components/evaluation/CriterionCard";
import { showSuccess } from "@/utils/toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { EvaluationCriterion } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/auth/SessionContext";

const EditEvaluationTemplatePage = () => {
  const { user } = useSession();
  const { templateId } = useParams<{ templateId: string }>();
  const { template, setTemplate, criteria, setCriteria, loading, fetchData } = useEvaluationTemplateBuilderData();
  const { handleAddCriterion, handleDeleteCriterion, handleUpdateCriterion, handleUpdateCriteriaOrder } = useEvaluationCriteriaActions({ templateId, setCriteria });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCriterion, setSelectedCriterion] = useState<EvaluationCriterion | null>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
    }
  }, [template]);

  const handleDetailsSave = useCallback(async () => {
    if (!templateId || !user) return;
    const { error } = await supabase
      .from('evaluation_templates')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', templateId);
    
    if (!error) {
      showSuccess("Template details saved.");
      setTemplate(prev => prev ? { ...prev, name, description: description || null } : null);
    }
  }, [templateId, name, description, user, setTemplate]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = criteria.findIndex(c => c.id === active.id);
      const newIndex = criteria.findIndex(c => c.id === over.id);
      const newOrderedCriteria = arrayMove(criteria, oldIndex, newIndex);
      setCriteria(newOrderedCriteria);
      handleUpdateCriteriaOrder(newOrderedCriteria);
    }
  };

  const confirmDelete = async (criterionId: string) => {
    if (selectedCriterion?.id === criterionId) setSelectedCriterion(null);
    const success = await handleDeleteCriterion(criterionId);
    if (success) {
      setCriteria(prev => prev.filter(c => c.id !== criterionId));
      showSuccess("Criterion deleted.");
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

  if (!template) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold">Template not found</h1>
        <p className="text-muted-foreground">The evaluation template you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Link to="/creator/evaluation-templates" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Templates
      </Link>
      
      <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg">
        <ResizablePanel defaultSize={selectedCriterion ? 65 : 100} minSize={30}>
          <div className="p-6 h-full overflow-y-auto">
            <Card className="mx-auto max-w-3xl mb-8">
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>Define the name and description for this evaluation template.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={handleDetailsSave} placeholder="Template Name" />
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={handleDetailsSave} placeholder="Template Description (optional)" />
              </CardContent>
            </Card>

            <Card className="mx-auto max-w-3xl">
              <CardHeader>
                <CardTitle>Evaluation Criteria</CardTitle>
                <CardDescription>Add and arrange the criteria for this scorecard. Drag to reorder.</CardDescription>
              </CardHeader>
              <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={criteria.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {criteria.map(criterion => (
                      <CriterionCard key={criterion.id} criterion={criterion} onDelete={confirmDelete} onEdit={setSelectedCriterion} />
                    ))}
                  </SortableContext>
                </DndContext>
                {criteria.length === 0 && <p className="text-center text-muted-foreground py-8">No criteria yet. Add one to get started.</p>}
                <Button variant="outline" className="w-full mt-4" onClick={handleAddCriterion}>
                  <Plus className="mr-2 h-4 w-4" /> Add Criterion
                </Button>
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>
        {selectedCriterion && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={25}>
              <p className="p-6">Properties panel for "{selectedCriterion.label}" will be implemented here.</p>
              <Button onClick={() => setSelectedCriterion(null)}>Close</Button>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default EditEvaluationTemplatePage;