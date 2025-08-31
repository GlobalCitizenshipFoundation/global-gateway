"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, Workflow, Lock, Globe, Edit, Copy, Save, CheckCircle, Clock } from "lucide-react";
import { PathwayTemplate, Phase } from "../services/pathway-template-service";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplateByIdAction, getPhasesAction, reorderPhasesAction, softDeletePhaseAction, createTemplateVersionAction, publishPathwayTemplateAction, updatePathwayTemplateStatusAction } from "../actions";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CloneTemplateDialog } from "./CloneTemplateDialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { InspectorPanel } from "./InspectorPanel"; // New InspectorPanel component
import { TemplateVersionHistory } from "./TemplateVersionHistory"; // Import TemplateVersionHistory
import { BranchingConfigForm } from "./BranchingConfigForm"; // Import BranchingConfigForm
import { DropResult } from "@hello-pangea/dnd"; // Import DropResult

interface PathwayTemplateDetailProps {
  templateId: string;
}

export function PathwayTemplateDetail({ templateId }: PathwayTemplateDetailProps) {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [template, setTemplate] = useState<PathwayTemplate | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null); // Track selected phase for inspector
  const [isEditingTemplateDetails, setIsEditingTemplateDetails] = useState(false); // Track if template details are being edited
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [isBranchingDialogOpen, setIsBranchingDialogOpen] = useState(false); // State for branching dialog
  const [branchingPhase, setBranchingPhase] = useState<Phase | undefined>(undefined); // State for phase being branched

  const fetchTemplateAndPhases = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTemplate = await getTemplateByIdAction(templateId);
      if (!fetchedTemplate) {
        toast.error("Pathway template not found or unauthorized.");
        router.push("/pathways");
        return;
      }
      setTemplate(fetchedTemplate);

      const fetchedPhases = await getPhasesAction(templateId);
      if (fetchedPhases) {
        setPhases(fetchedPhases);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load pathway template details.");
      router.push("/pathways");
    } finally {
      setIsLoading(false);
    }
  }, [templateId, router]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchTemplateAndPhases();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view pathway templates.");
      router.push("/login");
    }
  }, [user, isSessionLoading, fetchTemplateAndPhases]);

  const handlePhaseSaved = () => {
    fetchTemplateAndPhases(); // Re-fetch to update list and order indices
    setSelectedPhaseId(null); // Close inspector after saving
    setIsEditingTemplateDetails(false);
  };

  const handleTemplateSaved = (updatedTemplateId?: string) => {
    // If the template ID changed (e.g., after a clone, though clone redirects),
    // or if it's an update, re-fetch and close the inspector.
    fetchTemplateAndPhases(); // Re-fetch to update template details
    setIsEditingTemplateDetails(false);
    setSelectedPhaseId(null); // Close inspector
    // If a new template was created and this callback is used, it would redirect.
    // For edits, we just refresh the current page.
    if (updatedTemplateId && updatedTemplateId !== templateId) {
      router.push(`/pathways/${updatedTemplateId}`);
    }
  };

  const handleEditPhase = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    setIsEditingTemplateDetails(false);
  };

  const handleConfigurePhase = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    setIsEditingTemplateDetails(false);
  };

  const handleConfigureBranching = (phase: Phase) => {
    setBranchingPhase(phase);
    setIsBranchingDialogOpen(true);
  };

  const handleBranchingConfigSaved = () => {
    setIsBranchingDialogOpen(false);
    setBranchingPhase(undefined);
    fetchTemplateAndPhases(); // Re-fetch to update workflow canvas
  };

  const handleDeletePhase = async (phaseId: string) => {
    try {
      const success = await softDeletePhaseAction(phaseId, templateId);
      if (success) {
        toast.success("Phase soft-deleted successfully!");
        fetchTemplateAndPhases(); // Re-fetch to update list and order indices
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete phase.");
    }
  };

  const handleReorderPhases = async (reorderedPhaseIdsAndOrder: { id: string; order_index: number }[]) => {
    // Create a new phases array with updated order_index, preserving all other properties
    const newPhases = reorderedPhaseIdsAndOrder.map(reordered => {
      const originalPhase = phases.find(p => p.id === reordered.id);
      return originalPhase ? { ...originalPhase, order_index: reordered.order_index } : null;
    }).filter(Boolean) as Phase[]; // Filter out any nulls and assert type

    setPhases(newPhases); // Optimistic update

    try {
      const success = await reorderPhasesAction(
        templateId,
        reorderedPhaseIdsAndOrder // Pass the array directly as it already has the correct structure
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

  const handleCreateVersion = async () => {
    try {
      const newVersion = await createTemplateVersionAction(templateId);
      if (newVersion) {
        toast.success(`New version ${newVersion.version_number} created!`);
        fetchTemplateAndPhases(); // Refresh to show new version
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create new version.");
    }
  };

  const handlePublishTemplate = async () => {
    try {
      const publishedVersion = await publishPathwayTemplateAction(templateId);
      if (publishedVersion) {
        toast.success(`Template published and new version ${publishedVersion.version_number} created!`);
        fetchTemplateAndPhases(); // Refresh to show new status and version
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to publish template.");
    }
  };

  const handleUpdateStatus = async (newStatus: PathwayTemplate['status']) => {
    try {
      const updatedTemplate = await updatePathwayTemplateStatusAction(templateId, newStatus);
      if (updatedTemplate) {
        toast.success(`Template status updated to '${newStatus}'!`);
        fetchTemplateAndPhases();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update template status.");
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
    <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh - var(--header-height) - 64px)] rounded-xl border">
      <ResizablePanel defaultSize={70} minSize={40}>
        <div className="flex flex-col h-full p-6 space-y-8 overflow-y-auto">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
              <Link href="/pathways">
                <ArrowLeft className="mr-2 h-5 w-5" /> Back to Templates
              </Link>
            </Button>
            <div className="flex space-x-2">
              {canModifyTemplate && (
                <>
                  <Button variant="outlined" className="rounded-full px-6 py-3 text-label-large" onClick={handleCreateVersion}>
                    <Save className="mr-2 h-5 w-5" /> Save New Version
                  </Button>
                  {currentTemplate.status !== 'published' && (
                    <Button variant="filled" className="rounded-full px-6 py-3 text-label-large" onClick={handlePublishTemplate}>
                      <CheckCircle className="mr-2 h-5 w-5" /> Publish Template
                    </Button>
                  )}
                  {currentTemplate.status === 'published' && (
                    <Button variant="tonal" className="rounded-full px-6 py-3 text-label-large" onClick={() => handleUpdateStatus('archived')}>
                      <Clock className="mr-2 h-5 w-5" /> Archive Template
                    </Button>
                  )}
                </>
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
              <p>Status: <span className="font-medium capitalize">{currentTemplate.status.replace('_', ' ')}</span></p>
              <p>Created: {new Date(currentTemplate.created_at).toLocaleDateString()}</p>
              <p>Last Updated: {new Date(currentTemplate.updated_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mt-8">
            <h2 className="text-headline-large font-bold text-foreground">Phases</h2>
            {canModifyTemplate && (
              <Button onClick={() => { setSelectedPhaseId("new"); setIsEditingTemplateDetails(false); }} className="rounded-full px-6 py-3 text-label-large">
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Phase
              </Button>
            )}
          </div>

          {phases.length === 0 ? (
            <Card className="rounded-xl shadow-md p-8 text-center">
              <CardTitle className="text-headline-small text-muted-foreground mb-4">No Phases Defined</CardTitle>
              <CardDescription className="text-body-medium text-muted-foreground">
                This template currently has no phases. Add phases to define its workflow.
              </CardDescription>
              {canModifyTemplate && (
                <Button onClick={() => { setSelectedPhaseId("new"); setIsEditingTemplateDetails(false); }} className="mt-6 rounded-full px-6 py-3 text-label-large">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add First Phase
                </Button>
              )}
            </Card>
          ) : (
            <WorkflowCanvas
              phases={phases}
              onReorder={handleReorderPhases}
              onEditPhase={handleEditPhase}
              onDeletePhase={handleDeletePhase}
              onConfigurePhase={handleConfigurePhase}
              onConfigureBranching={handleConfigureBranching}
              canModify={canModifyTemplate}
            />
          )}

          <TemplateVersionHistory
            pathwayTemplateId={templateId}
            canModify={canModifyTemplate}
            onTemplateRolledBack={fetchTemplateAndPhases}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={30} minSize={20}>
        <InspectorPanel
          template={currentTemplate}
          phases={phases}
          selectedPhaseId={selectedPhaseId}
          isEditingTemplateDetails={isEditingTemplateDetails}
          onClose={() => { setSelectedPhaseId(null); setIsEditingTemplateDetails(false); }}
          onSelectPhase={setSelectedPhaseId}
          onEditTemplateDetails={() => { setIsEditingTemplateDetails(true); setSelectedPhaseId(null); }}
          canModifyTemplate={canModifyTemplate}
        />
      </ResizablePanel>

      {/* Branching Configuration Dialog */}
      {branchingPhase && (
        <Dialog open={isBranchingDialogOpen} onOpenChange={setIsBranchingDialogOpen}>
          <DialogContent className="sm:max-w-[600px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-headline-small">
                Configure Branching for &quot;{branchingPhase.name}&quot;
              </DialogTitle>
            </DialogHeader>
            <BranchingConfigForm
              pathwayTemplateId={templateId}
              phase={branchingPhase}
              onConfigSaved={handleBranchingConfigSaved}
              canModify={canModifyTemplate}
            />
          </DialogContent>
        </Dialog>
      )}

      <CloneTemplateDialog
        isOpen={isCloneDialogOpen}
        onClose={() => { setIsCloneDialogOpen(false); fetchTemplateAndPhases(); }}
        templateId={templateId}
        originalTemplateName={currentTemplate.name}
      />
    </ResizablePanelGroup>
  );
}