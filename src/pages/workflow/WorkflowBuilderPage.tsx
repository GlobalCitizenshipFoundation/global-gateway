import { Link } from "react-router-dom";
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
import { WorkflowStageCard } from "@/components/workflow/WorkflowStageCard";
import { showSuccess, showError } from "@/utils/toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { WorkflowStagePropertiesPanel } from "@/components/workflow/WorkflowStagePropertiesPanel";
import { WorkflowStage, Form as FormType, EmailTemplate } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/auth/SessionContext";

const WorkflowBuilderPage = () => {
  const { user } = useSession();
  const { workflowId, template, stages, setStages, loading, fetchData } = useWorkflowBuilderData();
  const { isSubmitting, handleUpdateTemplateDetails, handleAddStage, handleDeleteStage, handleUpdateStageOrder, handleUpdateStageDetails } = useWorkflowTemplateActions({});

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);
  const [forms, setForms] = useState<FormType[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
    }
  }, [template]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!user) return;
      const formsPromise = supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_template', false)
        .eq('status', 'published')
        .order('name', { ascending: true });
      const emailsPromise = supabase.from('email_templates').select('*').eq('user_id', user.id).eq('status', 'published').order('name', { ascending: true });
      
      const [{ data: formsData, error: formsError }, { data: emailsData, error: emailsError }] = await Promise.all([formsPromise, emailsPromise]);

      if (formsError) showError("Could not load forms for selection.");
      else setForms(formsData as FormType[]);

      if (emailsError) showError("Could not load email templates for selection.");
      else setEmailTemplates(emailsData as EmailTemplate[]);
    };
    fetchDropdownData();
  }, [user]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSaveDetails = () => {
    if (workflowId) {
      handleUpdateTemplateDetails(workflowId, name, description);
    }
  };

  const addNewStage = async () => {
    if (workflowId) {
      const newStage = await handleAddStage(workflowId, stages);
      if (newStage) {
        setStages(prev => [...prev, newStage]);
        showSuccess("New stage added.");
      }
    }
  };

  const deleteStage = async (stageId: string) => {
    if (selectedStage?.id === stageId) {
      setSelectedStage(null);
    }
    const success = await handleDeleteStage(stageId);
    if (success) {
      setStages(prev => prev.filter(s => s.id !== stageId));
      showSuccess("Stage deleted.");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex(s => s.id === active.id);
      const newIndex = stages.findIndex(s => s.id === over.id);
      const newOrderedStages = arrayMove(stages, oldIndex, newIndex);
      setStages(newOrderedStages);

      const updates = newOrderedStages.map((stage, index) => ({
        id: stage.id,
        order_index: index + 1,
      }));
      handleUpdateStageOrder(updates);
    }
  };

  const handleSaveStage = async (stageId: string, values: Partial<WorkflowStage>) => {
    const success = await handleUpdateStageDetails(stageId, values);
    if (success) {
      fetchData(); // Re-fetch to get the latest data
      setSelectedStage(null);
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
      
      <ResizablePanelGroup direction="horizontal" className="min-h-[600px] border rounded-lg">
        <ResizablePanel defaultSize={selectedStage ? 65 : 100} minSize={30}>
          <div className="p-6 h-full overflow-y-auto">
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
                <CardTitle>Workflow Stages</CardTitle>
                <CardDescription>Add and arrange the stages for this workflow. Drag to reorder.</CardDescription>
              </CardHeader>
              <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {stages.map(stage => (
                      <WorkflowStageCard key={stage.id} stage={stage} onDelete={deleteStage} onEdit={setSelectedStage} />
                    ))}
                  </SortableContext>
                </DndContext>
                {stages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No stages yet. Add one to get started.</p>
                )}
                <Button variant="outline" className="w-full mt-4" onClick={addNewStage}>
                  <Plus className="mr-2 h-4 w-4" /> Add Stage
                </Button>
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>
        {selectedStage && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={25}>
              <WorkflowStagePropertiesPanel
                stage={selectedStage}
                allStages={stages}
                forms={forms}
                emailTemplates={emailTemplates}
                onSave={handleSaveStage}
                onClose={() => setSelectedStage(null)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default WorkflowBuilderPage;