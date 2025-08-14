import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useWorkflowBuilderData } from "@/hooks/workflow/useWorkflowBuilderData";
import { useWorkflowTemplateActions } from "@/hooks/workflow/useWorkflowTemplateActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef, useCallback } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { WorkflowStageCard } from "@/components/workflow/WorkflowStageCard";
import { showSuccess, showError } from "@/utils/toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { WorkflowStagePropertiesPanel } from "@/components/workflow/WorkflowStagePropertiesPanel";
import { WorkflowStage, Form as FormType, EmailTemplate, EvaluationTemplate, EvaluationCriterion } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/auth/SessionContext";
import { isWorkflowPublishable } from '@/utils/workflowValidation';
import { isEvaluationTemplatePublishable } from "@/utils/evaluation/evaluationValidation";
import { WorkflowActions } from "@/components/workflow/WorkflowActions";

const AUTO_SAVE_DEBOUNCE_TIME = 2000;

const WorkflowBuilderPage = () => {
  const { user } = useSession();
  const { workflowId, template, setTemplate, stages, setStages, loading, fetchData, isAutoSaving, setIsAutoSaving, hasUnsavedChanges, setHasUnsavedChanges, lastSavedTimestamp, setLastSavedTimestamp, lastEditedByUserName, creatorUserName } = useWorkflowBuilderData();
  const { isSubmitting, handleUpdateTemplateDetails, handleAddStage, handleDeleteStage, handleUpdateStageOrder, handleUpdateStageDetails, handleUpdateTemplateStatus, handleDuplicateTemplate } = useWorkflowTemplateActions({});

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);
  const [forms, setForms] = useState<FormType[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [evaluationTemplates, setEvaluationTemplates] = useState<EvaluationTemplate[]>([]);
  const [allCriteria, setAllCriteria] = useState<EvaluationCriterion[]>([]);
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
    }
  }, [template]);

  useEffect(() => {
    const { errors: stageErrors } = isWorkflowPublishable(stages);
    const combinedErrors = new Map(stageErrors);

    stages.forEach(stage => {
      if (stage.step_type === 'review' && stage.evaluation_template_id) {
        const templateCriteria = allCriteria.filter(c => c.template_id === stage.evaluation_template_id);
        const { publishable: templateIsPublishable } = isEvaluationTemplatePublishable(templateCriteria);
        if (!templateIsPublishable) {
          const templateName = evaluationTemplates.find(t => t.id === stage.evaluation_template_id)?.name || 'template';
          combinedErrors.set(stage.id, `Attached evaluation template '${templateName}' is incomplete.`);
        }
      }
    });

    setValidationErrors(combinedErrors);
  }, [stages, allCriteria, evaluationTemplates]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!user) return;
      const formsPromise = supabase.from('forms').select('*').eq('user_id', user.id).eq('is_template', false).eq('status', 'published').order('name', { ascending: true });
      const emailsPromise = supabase.from('email_templates').select('*').eq('user_id', user.id).eq('status', 'published').order('name', { ascending: true });
      const evaluationsPromise = supabase.from('evaluation_templates').select('*').eq('user_id', user.id).order('name', { ascending: true });
      
      const [{ data: formsData, error: formsError }, { data: emailsData, error: emailsError }, { data: evalsData, error: evalsError }] = await Promise.all([formsPromise, emailsPromise, evaluationsPromise]);

      if (formsError) showError("Could not load forms for selection.");
      else setForms(formsData as FormType[]);

      if (emailsError) showError("Could not load email templates for selection.");
      else setEmailTemplates(emailsData as EmailTemplate[]);

      if (evalsError) {
        showError("Could not load evaluation templates for selection.");
      } else if (evalsData) {
        setEvaluationTemplates(evalsData as EvaluationTemplate[]);
        const templateIds = evalsData.map(t => t.id);
        if (templateIds.length > 0) {
          const { data: criteriaData, error: criteriaError } = await supabase
            .from('evaluation_criteria')
            .select('*')
            .in('template_id', templateIds);
          if (criteriaError) {
            showError("Could not load evaluation criteria for validation.");
          } else {
            setAllCriteria(criteriaData as EvaluationCriterion[]);
          }
        }
      }
    };
    fetchDropdownData();
  }, [user]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    setHasUnsavedChanges(true);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (workflowId) {
        setIsAutoSaving(true);
        const success = await handleUpdateTemplateDetails(workflowId, name, description);
        if (success) {
          setLastSavedTimestamp(new Date());
          setHasUnsavedChanges(false);
        }
        setIsAutoSaving(false);
      }
    }, AUTO_SAVE_DEBOUNCE_TIME);
  }, [workflowId, name, description, handleUpdateTemplateDetails, setIsAutoSaving, setHasUnsavedChanges, setLastSavedTimestamp]);

  useEffect(() => {
    if (!loading && template && (name !== template.name || description !== (template.description || ''))) {
      triggerAutoSave();
    }
  }, [name, description, template, loading, triggerAutoSave]);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

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
    if (selectedStage?.id === stageId) setSelectedStage(null);
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
      const newOrderedStages = arrayMove(stages, oldIndex, newIndex).map((stage, index) => ({ ...stage, order_index: index + 1 }));
      setStages(newOrderedStages);
      handleUpdateStageOrder(newOrderedStages);
    }
  };

  const handleSaveStage = async (stageId: string, values: Partial<WorkflowStage>) => {
    const success = await handleUpdateStageDetails(stageId, values);
    if (success) {
      fetchData();
      setSelectedStage(null);
    }
  };

  const handlePublish = async () => {
    if (workflowId) {
      const success = await handleUpdateTemplateStatus(workflowId, 'published');
      if (success) setTemplate(prev => prev ? { ...prev, status: 'published' } : null);
    }
  };

  const handleUnpublish = async () => {
    if (workflowId) {
      const success = await handleUpdateTemplateStatus(workflowId, 'draft');
      if (success) setTemplate(prev => prev ? { ...prev, status: 'draft' } : null);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (workflowId) {
      setIsDuplicating(true);
      await handleDuplicateTemplate(workflowId, newTemplateName);
      setIsDuplicating(false);
      setIsDuplicateDialogOpen(false);
    }
  };

  const renderStatusMessage = () => {
    if (isAutoSaving) return <span className="text-blue-500">Saving...</span>;
    if (hasUnsavedChanges) return <span className="text-orange-500">Unsaved changes</span>;
    if (lastSavedTimestamp) return `Last saved: ${lastSavedTimestamp.toLocaleTimeString()}`;
    return null;
  };

  if (loading) return <div className="container py-12"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="container py-12">
      <Link to="/creator/workflows" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" />Back to Workflows</Link>
      <ResizablePanelGroup direction="horizontal" className="min-h-[600px] border rounded-lg">
        <ResizablePanel defaultSize={selectedStage ? 65 : 100} minSize={30}>
          <div className="p-6 h-full overflow-y-auto">
            <Card className="mx-auto max-w-3xl mb-8">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Workflow Settings</CardTitle>
                    <CardDescription>Define the name and description for this workflow template.</CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <p>{renderStatusMessage()}</p>
                    {lastEditedByUserName && <p className="text-xs">By: {lastEditedByUserName}</p>}
                    {creatorUserName && <p className="text-xs">Created by: {creatorUserName}</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow Name" />
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Workflow Description (optional)" />
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
                    {stages.map(stage => <WorkflowStageCard key={stage.id} stage={stage} validationError={validationErrors.get(stage.id) || null} onDelete={deleteStage} onEdit={setSelectedStage} />)}
                  </SortableContext>
                </DndContext>
                {stages.length === 0 && <p className="text-center text-muted-foreground py-8">No stages yet. Add one to get started.</p>}
                <Button variant="outline" className="w-full mt-4" onClick={addNewStage}><Plus className="mr-2 h-4 w-4" /> Add Stage</Button>
              </CardContent>
            </Card>
          </div>
        </ResizablePanel>
        {selectedStage && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={25}>
              <WorkflowStagePropertiesPanel stage={selectedStage} allStages={stages} forms={forms} emailTemplates={emailTemplates} evaluationTemplates={evaluationTemplates} onSave={handleSaveStage} onClose={() => setSelectedStage(null)} />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      <WorkflowActions
        isSubmitting={isAutoSaving || isSubmitting}
        hasUnsavedChanges={hasUnsavedChanges}
        status={template?.status || 'draft'}
        onSaveDraft={() => triggerAutoSave()}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onOpenDuplicateDialog={() => { setNewTemplateName(`Copy of ${name}`); setIsDuplicateDialogOpen(true); }}
        isDuplicateDialogOpen={isDuplicateDialogOpen}
        onCloseDuplicateDialog={() => setIsDuplicateDialogOpen(false)}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        isDuplicating={isDuplicating}
        onConfirmDuplicate={handleConfirmDuplicate}
      />
    </div>
  );
};

export default WorkflowBuilderPage;