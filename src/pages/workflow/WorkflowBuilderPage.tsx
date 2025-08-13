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
import { WorkflowStepCard } from "@/components/workflow/WorkflowStepCard";
import { showSuccess, showError } from "@/utils/toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { WorkflowStepPropertiesPanel } from "@/components/workflow/WorkflowStepPropertiesPanel";
import { WorkflowStep, Form as FormType, EmailTemplate } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/auth/SessionContext";

const WorkflowBuilderPage = () => {
  const { user } = useSession();
  const { workflowId, template, steps, setSteps, loading, fetchData } = useWorkflowBuilderData();
  const { isSubmitting, handleUpdateTemplateDetails, handleAddStep, handleDeleteStep, handleUpdateStepOrder, handleUpdateStepDetails } = useWorkflowTemplateActions({});

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
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
      const formsPromise = supabase.from('forms').select('*').eq('user_id', user.id).order('name', { ascending: true });
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
    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
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

  const handleSaveStep = async (stepId: string, values: Partial<WorkflowStep>) => {
    const success = await handleUpdateStepDetails(stepId, values);
    if (success) {
      fetchData(); // Re-fetch to get the latest data
      setSelectedStep(null);
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
        <ResizablePanel defaultSize={selectedStep ? 65 : 100} minSize={30}>
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
                <CardTitle>Workflow Steps</CardTitle>
                <CardDescription>Add and arrange the steps for this workflow. Drag to reorder.</CardDescription>
              </CardHeader>
              <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {steps.map(step => (
                      <WorkflowStepCard key={step.id} step={step} onDelete={deleteStep} onEdit={setSelectedStep} />
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
        </ResizablePanel>
        {selectedStep && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={25}>
              <WorkflowStepPropertiesPanel
                step={selectedStep}
                forms={forms}
                emailTemplates={emailTemplates}
                onSave={handleSaveStep}
                onClose={() => setSelectedStep(null)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

export default WorkflowBuilderPage;