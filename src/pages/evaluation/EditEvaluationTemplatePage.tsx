import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useEvaluationTemplateBuilderData } from "@/hooks/evaluation/useEvaluationTemplateBuilderData";
import { useEvaluationCriteriaActions } from "@/hooks/evaluation/useEvaluationCriteriaActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useRef } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { showSuccess, showError } from "@/utils/toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { EvaluationCriterion, EvaluationSection } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/auth/SessionContext";
import { CriterionPropertiesPanel } from "@/components/evaluation/CriterionPropertiesPanel";
import { isEvaluationTemplatePublishable } from "@/utils/evaluation/evaluationValidation";
import { EvaluationTemplatePreviewDialog } from "@/components/evaluation/EvaluationTemplatePreviewDialog";
import { useEvaluationTemplateActions } from "@/hooks/evaluation/useEvaluationTemplateActions";
import { AddEvaluationSectionForm } from "@/components/evaluation/AddEvaluationSectionForm";
import { EvaluationSectionPropertiesPanel } from "@/components/evaluation/EvaluationSectionPropertiesPanel";
import { EvaluationSectionsList } from "@/components/evaluation/EvaluationSectionsList";
import { UncategorizedCriteriaList } from "@/components/evaluation/UncategorizedCriteriaList";
import { useEvaluationCriteriaDragAndDrop } from "@/hooks/evaluation/useEvaluationCriteriaDragAndDrop";
import { useEvaluationSectionDragAndDrop } from "@/hooks/evaluation/useEvaluationSectionDragAndDrop";
import { CriterionCard } from "@/components/evaluation/CriterionCard";

const AUTO_SAVE_DEBOUNCE_TIME = 2000;

const EditEvaluationTemplatePage = () => {
  const { user } = useSession();
  const { templateId } = useParams<{ templateId: string }>();
  const data = useEvaluationTemplateBuilderData();
  const { template, setTemplate, criteria, setCriteria, sections, setSections, loading, fetchData, lastEditedByUserName, creatorUserName, lastSavedTimestamp, setLastSavedTimestamp, hasUnsavedChanges, setHasUnsavedChanges, isAutoSaving, setIsAutoSaving } = data;
  const actions = useEvaluationCriteriaActions({ templateId, setCriteria, setSections });
  const { handleUpdateTemplateStatus } = useEvaluationTemplateActions({ fetchTemplates: fetchData });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCriterion, setSelectedCriterion] = useState<EvaluationCriterion | null>(null);
  const [selectedSection, setSelectedSection] = useState<EvaluationSection | null>(null);
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { sensors: criteriaSensors, onDragStart: onCriterionDragStart, onDragEnd: onCriterionDragEnd, activeDragItem: activeCriterionDragItem } = useEvaluationCriteriaDragAndDrop({ criteria, setCriteria, sections, fetchData });
  const { sensors: sectionSensors, onDragStart: onSectionDragStart, onDragEnd: onSectionDragEnd, activeDragItem: activeSectionDragItem } = useEvaluationSectionDragAndDrop({ sections, setSections, fetchData });
  const combinedSensors = [...criteriaSensors, ...sectionSensors];

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
    }
  }, [template]);

  useEffect(() => {
    const { errors } = isEvaluationTemplatePublishable(criteria);
    setValidationErrors(errors);
  }, [criteria]);

  const handleDetailsSave = useCallback(async (newName: string, newDescription: string) => {
    if (!templateId || !user) return false;
    const { error } = await supabase
      .from('evaluation_templates')
      .update({ name: newName, description: newDescription, updated_at: new Date().toISOString(), last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() })
      .eq('id', templateId);
    
    if (error) {
      showError("Failed to save template details.");
      return false;
    }
    return true;
  }, [templateId, user]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    setHasUnsavedChanges(true);
    autoSaveTimeoutRef.current = setTimeout(async () => {
      setIsAutoSaving(true);
      const success = await handleDetailsSave(name, description);
      if (success) {
        setLastSavedTimestamp(new Date());
        setHasUnsavedChanges(false);
        fetchData();
      }
      setIsAutoSaving(false);
    }, AUTO_SAVE_DEBOUNCE_TIME);
  }, [name, description, handleDetailsSave, setIsAutoSaving, setHasUnsavedChanges, setLastSavedTimestamp, fetchData]);

  useEffect(() => {
    if (!loading && template && (name !== template.name || description !== (template.description || ''))) {
      triggerAutoSave();
    }
  }, [name, description, template, loading, triggerAutoSave]);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Criterion") onCriterionDragStart(event);
    else if (event.active.data.current?.type === "Section") onSectionDragStart(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (activeCriterionDragItem) onCriterionDragEnd(event);
    else if (activeSectionDragItem) onSectionDragEnd(event);
  };

  const confirmDeleteCriterion = async (criterionId: string) => {
    if (selectedCriterion?.id === criterionId) setSelectedCriterion(null);
    const success = await actions.handleDeleteCriterion(criterionId);
    if (success) {
      setCriteria(prev => prev.filter(c => c.id !== criterionId));
      showSuccess("Criterion deleted.");
    }
  };

  const confirmDeleteSection = async (sectionId: string, action: 'delete_criteria' | 'uncategorize_criteria') => {
    if (selectedSection?.id === sectionId) setSelectedSection(null);
    const success = await actions.handleDeleteSection(sectionId, action);
    if (success) {
      fetchData();
      showSuccess("Section deleted.");
    }
  };

  const handleSaveCriterion = async (criterionId: string, values: Partial<EvaluationCriterion>) => {
    const success = await actions.handleUpdateCriterion(criterionId, values);
    if (success) {
      fetchData();
      setSelectedCriterion(null);
      showSuccess("Criterion updated successfully.");
    }
  };

  const handleSaveSection = async (sectionId: string, values: Partial<EvaluationSection>) => {
    const success = await actions.handleUpdateSection(sectionId, values);
    if (success) {
      fetchData();
      setSelectedSection(null);
      showSuccess("Section updated successfully.");
    }
  };

  const getCriteriaForSection = useCallback((sectionId: string | null) => {
    return criteria.filter(c => c.section_id === sectionId).sort((a, b) => a.order - b.order);
  }, [criteria]);

  const renderStatusMessage = () => {
    if (isAutoSaving) return <span className="text-blue-500">Saving...</span>;
    if (hasUnsavedChanges) return <span className="text-orange-500">Unsaved changes</span>;
    if (lastSavedTimestamp) return `Last saved: ${lastSavedTimestamp.toLocaleTimeString()}`;
    return null;
  };

  if (loading) return <div className="container py-12"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full" /></div>;
  if (!template) return <div className="container py-12 text-center"><h1 className="text-2xl font-bold">Template not found</h1></div>;

  return (
    <div className="container py-12">
      <Link to="/creator/evaluation-templates" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" />Back to Templates</Link>
      <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg">
        <ResizablePanel defaultSize={selectedCriterion || selectedSection ? 65 : 100} minSize={30}>
          <div className="p-6 h-full overflow-y-auto">
            <Card className="mx-auto max-w-3xl mb-8">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div><CardTitle>Template Settings</CardTitle><CardDescription>Define the name and description for this evaluation template.</CardDescription></div>
                  <div className="text-sm text-muted-foreground text-right"><p>{renderStatusMessage()}</p>{lastEditedByUserName && <p className="text-xs">By: {lastEditedByUserName}</p>}{creatorUserName && <p className="text-xs">Created by: {creatorUserName}</p>}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template Name" />
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Template Description (optional)" />
              </CardContent>
            </Card>
            <DndContext sensors={combinedSensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <EvaluationSectionsList
                sections={sections}
                criteria={criteria}
                loading={loading}
                validationErrors={validationErrors}
                getCriteriaForSection={getCriteriaForSection}
                onDeleteSection={confirmDeleteSection}
                onDeleteCriterion={confirmDeleteCriterion}
                onEditCriterion={setSelectedCriterion}
                onEditSection={setSelectedSection}
                onQuickAddCriterion={(sectionId) => actions.handleAddCriterion(sectionId)}
              />
              <UncategorizedCriteriaList
                uncategorizedCriteria={getCriteriaForSection(null)}
                validationErrors={validationErrors}
                onDelete={confirmDeleteCriterion}
                onEdit={setSelectedCriterion}
              />
              <DragOverlay>
                {activeCriterionDragItem ? <CriterionCard criterion={activeCriterionDragItem} validationError={null} onDelete={() => {}} onEdit={() => {}} /> : null}
                {activeSectionDragItem ? <div className="p-4 bg-secondary rounded-md shadow-lg cursor-grabbing"><span className="font-semibold">{activeSectionDragItem.name}</span></div> : null}
              </DragOverlay>
            </DndContext>
            <AddEvaluationSectionForm onAddSection={(name, desc) => actions.handleAddSection(name, desc).then(() => {})} />
            <Button variant="outline" className="w-full mt-8" onClick={() => actions.handleAddCriterion(null)}><Plus className="mr-2 h-4 w-4" /> Add Uncategorized Criterion</Button>
          </div>
        </ResizablePanel>
        {selectedCriterion && (
          <><ResizableHandle withHandle /><ResizablePanel defaultSize={35} minSize={25}><CriterionPropertiesPanel criterion={selectedCriterion} sections={sections} onSave={handleSaveCriterion} onClose={() => setSelectedCriterion(null)} /></ResizablePanel></>
        )}
        {selectedSection && (
          <><ResizableHandle withHandle /><ResizablePanel defaultSize={35} minSize={25}><EvaluationSectionPropertiesPanel section={selectedSection} onSave={handleSaveSection} onClose={() => setSelectedSection(null)} /></ResizablePanel></>
        )}
      </ResizablePanelGroup>
      <div className="flex justify-between items-center mt-8 pt-4 border-t">
        <Button variant="outline" onClick={() => handleDetailsSave(name, description)} disabled={isAutoSaving || !hasUnsavedChanges}>Save Draft</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>Preview</Button>
          {template.status === 'draft' ? (<Button onClick={() => handleUpdateTemplateStatus(template.id, 'published')}>Publish</Button>) : (<Button variant="outline" onClick={() => handleUpdateTemplateStatus(template.id, 'draft')}>Unpublish</Button>)}
        </div>
      </div>
      <EvaluationTemplatePreviewDialog isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} templateName={name} criteria={criteria} />
    </div>
  );
};

export default EditEvaluationTemplatePage;