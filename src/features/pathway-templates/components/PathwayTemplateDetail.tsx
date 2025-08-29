"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, Workflow, Lock, Globe, Edit, Copy } from "lucide-react"; // Import Copy icon
import { PathwayTemplate, Phase } from "../services/pathway-template-service";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplateByIdAction, getPhasesAction, reorderPhasesAction, deletePhaseAction } from "../actions";
import { PhaseFormDialog } from "./PhaseFormDialog";
import { PhaseCard } from "./PhaseCard";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhaseConfigurationPanel } from "./PhaseConfigurationPanel";
import { CloneTemplateDialog } from "./CloneTemplateDialog"; // Import CloneTemplateDialog

interface PathwayTemplateDetailProps {
  templateId: string;
}

export function PathwayTemplateDetail({ templateId }: PathwayTemplateDetailProps) {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [template, setTemplate] = useState<PathwayTemplate | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPhaseFormOpen, setIsPhaseFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | undefined>(undefined);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [configuringPhase, setConfiguringPhase] = useState<Phase | undefined>(undefined);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false); // State for clone dialog

  const fetchTemplateAndPhases = async () => {
    setIsLoading(true);
    try {
      const fetchedTemplate = await getTemplateByIdAction(templateId);
      if (!fetchedTemplate) {
        toast.error("Pathway template not found or unauthorized.");
        router.push("/workbench/pathway-templates");
        return;
      }
      setTemplate(fetchedTemplate);

      const fetchedPhases = await getPhasesAction(templateId);
      if (fetchedPhases) {
        setPhases(fetchedPhases);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load template details.");
      router.push("/workbench/pathway-templates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchTemplateAndPhases();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view pathway templates.");
      router.push("/login");
    }
  }, [user, isSessionLoading, templateId]);

  const handlePhaseSaved = () => {
    fetchTemplateAndPhases(); // Re-fetch to update list and order indices
    setIsPhaseFormOpen(false);
    setEditingPhase(undefined);
  };

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setIsPhaseFormOpen(true);
  };

  const handleConfigurePhase = (phase: Phase) => {
    setConfiguringPhase(phase);
    setIsConfigDialogOpen(true);
  };

  const handleConfigSaved = () => {
    fetchTemplateAndPhases(); // Re-fetch to update phases with new config
    setIsConfigDialogOpen(false);
    setConfiguringPhase(undefined);
  };

  const handleDeletePhase = async (phaseId: string) => {
    try {
      const success = await deletePhaseAction(phaseId, templateId);
      if (success) {
        toast.success("Phase deleted successfully!");
        fetchTemplateAndPhases(); // Re-fetch to update list and order indices
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete phase.");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedPhases = Array.from(phases);
    const [removed] = reorderedPhases.splice(result.source.index, 1);
    reorderedPhases.splice(result.destination.index, 0, removed);

    const updatedPhases = reorderedPhases.map((phase, index) => ({
      ...phase,
      order_index: index,
    }));

    setPhases(updatedPhases); // Optimistic update

    try {
      const success = await reorderPhasesAction(
        templateId,
        updatedPhases.map((p) => ({ id: p.id, order_index: p.order_index }))
      );
      if (!success) {
        toast.error("Failed to reorder phases. Reverting changes.");
        fetchTemplateAndPhases(); // Revert on failure
      } else {
        toast.success("Phases reordered successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder phases. Reverting changes.");
      fetchTemplateAndPhases(); // Revert on failure
    }
  };

  if (isLoading || !template) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <Card className="rounded-xl shadow-md p-6">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-20 w-full mb-4" />
        </Card>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="rounded-xl shadow-md p-4 flex items-center">
              <Skeleton className="h-5 w-5 mr-4" />
              <div className="flex-grow">
                <Skeleton className="h-6 w-2/3 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md ml-4" />
              <Skeleton className="h-8 w-8 rounded-md ml-2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentUser = user!;
  const currentTemplate = template!;

  const userRole: string = currentUser.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';
  const canModifyTemplate: boolean = currentTemplate.creator_id === currentUser.id || isAdmin;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href="/workbench/pathway-templates">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Templates
          </Link>
        </Button>
        <div className="flex space-x-2">
          <Button variant="outlined" className="rounded-full px-6 py-3 text-label-large" onClick={() => setIsCloneDialogOpen(true)}>
            <Copy className="mr-2 h-5 w-5" /> Clone Template
          </Button>
          {canModifyTemplate && (
            <Button asChild className="rounded-full px-6 py-3 text-label-large">
              <Link href={`/workbench/pathway-templates/${currentTemplate.id}/edit`}>
                <Edit className="mr-2 h-5 w-5" /> Edit Template Details
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <Workflow className="h-7 w-7 text-primary" /> {currentTemplate.name}
            <TooltipProvider>
              {currentTemplate.is_private ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                    Private Template
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                    Public Template
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            {currentTemplate.description || "No description provided for this pathway template."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground">
          <p>Created: {new Date(currentTemplate.created_at).toLocaleDateString()}</p>
          <p>Last Updated: {new Date(currentTemplate.updated_at).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-8">
        <h2 className="text-headline-large font-bold text-foreground">Phases</h2>
        {canModifyTemplate && (
          <Button onClick={() => { setEditingPhase(undefined); setIsPhaseFormOpen(true); }} className="rounded-full px-6 py-3 text-label-large">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Phase
          </Button>
        )}
      </div>

      {phases.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Phases Defined</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            Start by adding phases to build out the workflow for this pathway template.
          </CardDescription>
          {canModifyTemplate && (
            <Button onClick={() => { setEditingPhase(undefined); setIsPhaseFormOpen(true); }} className="mt-6 rounded-full px-6 py-3 text-label-large">
              <PlusCircle className="mr-2 h-5 w-5" /> Add First Phase
            </Button>
          )}
        </Card>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="phases">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {phases.map((phase, index) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    index={index}
                    onEdit={handleEditPhase}
                    onDelete={handleDeletePhase}
                    onConfigure={handleConfigurePhase}
                    canEditOrDelete={canModifyTemplate}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <PhaseFormDialog
        isOpen={isPhaseFormOpen}
        onClose={() => setIsPhaseFormOpen(false)}
        pathwayTemplateId={templateId}
        initialData={editingPhase}
        onPhaseSaved={handlePhaseSaved}
        nextOrderIndex={phases.length}
      />

      {/* Phase Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-headline-small">
              Configure Phase
            </DialogTitle>
          </DialogHeader>
          {configuringPhase && (
            <PhaseConfigurationPanel
              phase={configuringPhase}
              pathwayTemplateId={templateId}
              onConfigSaved={handleConfigSaved}
              canModify={canModifyTemplate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Clone Template Dialog */}
      {template && (
        <CloneTemplateDialog
          isOpen={isCloneDialogOpen}
          onClose={() => { setIsCloneDialogOpen(false); }}
          templateId={template.id}
          originalTemplateName={template.name}
        />
      )}
    </div>
  );
}