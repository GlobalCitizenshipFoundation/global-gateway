"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, Workflow, Lock, Globe, Edit, Briefcase, CalendarDays } from "lucide-react";
import { Campaign, CampaignPhase } from "../services/campaign-service";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaignByIdAction, getCampaignPhasesAction, reorderCampaignPhasesAction, deleteCampaignPhaseAction } from "../actions";
import { CampaignPhaseFormDialog } from "./CampaignPhaseFormDialog";
import { CampaignPhaseCard } from "./CampaignPhaseCard";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CampaignPhaseConfigurationPanel } from "./CampaignPhaseConfigurationPanel";

interface CampaignDetailProps {
  campaignId: string;
}

export function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignPhases, setCampaignPhases] = useState<CampaignPhase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPhaseFormOpen, setIsPhaseFormOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<CampaignPhase | undefined>(undefined);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [configuringPhase, setConfiguringPhase, ] = useState<CampaignPhase | undefined>(undefined);

  const fetchCampaignAndPhases = async () => {
    setIsLoading(true);
    try {
      const fetchedCampaign = await getCampaignByIdAction(campaignId);
      if (!fetchedCampaign) {
        toast.error("Campaign not found or unauthorized.");
        router.push("/campaigns"); // Corrected redirect
        return;
      }
      setCampaign(fetchedCampaign);

      const fetchedPhases = await getCampaignPhasesAction(campaignId);
      if (fetchedPhases) {
        setCampaignPhases(fetchedPhases);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load campaign details.");
      router.push("/campaigns"); // Corrected redirect
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchCampaignAndPhases();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view campaigns.");
      router.push("/login");
    }
  }, [user, isSessionLoading, campaignId]);

  const handlePhaseSaved = () => {
    fetchCampaignAndPhases(); // Re-fetch to update list and order indices
    setIsPhaseFormOpen(false);
    setEditingPhase(undefined);
  };

  const handleEditPhase = (phase: CampaignPhase) => {
    setEditingPhase(phase);
    setIsPhaseFormOpen(true);
  };

  const handleConfigurePhase = (phase: CampaignPhase) => {
    setConfiguringPhase(phase);
    setIsConfigDialogOpen(true);
  };

  const handleConfigSaved = () => {
    fetchCampaignAndPhases(); // Re-fetch to update phases with new config
    setIsConfigDialogOpen(false);
    setConfiguringPhase(undefined);
  };

  const handleDeletePhase = async (phaseId: string) => {
    try {
      const success = await deleteCampaignPhaseAction(phaseId, campaignId);
      if (success) {
        toast.success("Campaign phase deleted successfully!");
        fetchCampaignAndPhases(); // Re-fetch to update list and order indices
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete campaign phase.");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedPhases = Array.from(campaignPhases);
    const [removed] = reorderedPhases.splice(result.source.index, 1);
    reorderedPhases.splice(result.destination.index, 0, removed);

    const updatedPhases = reorderedPhases.map((phase, index) => ({
      ...phase,
      order_index: index,
    }));

    setCampaignPhases(updatedPhases); // Optimistic update

    try {
      const success = await reorderCampaignPhasesAction(
        campaignId,
        updatedPhases.map((p) => ({ id: p.id, order_index: p.order_index }))
      );
      if (!success) {
        toast.error("Failed to reorder campaign phases. Reverting changes.");
        fetchCampaignAndPhases(); // Revert on failure
      } else {
        toast.success("Campaign phases reordered successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder campaign phases. Reverting changes.");
      fetchCampaignAndPhases(); // Revert on failure
    }
  };

  if (isLoading || !campaign) {
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
  const currentCampaign = campaign!;

  const userRole: string = currentUser.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';
  const canModifyCampaign: boolean = currentCampaign.creator_id === currentUser.id || isAdmin;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href="/campaigns"> {/* Corrected link */}
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Campaigns
          </Link>
        </Button>
        <div className="flex space-x-2">
          {canModifyCampaign && (
            <Button asChild className="rounded-full px-6 py-3 text-label-large">
              <Link href={`/campaigns/${currentCampaign.id}/edit`}> {/* Corrected link */}
                <Edit className="mr-2 h-5 w-5" /> Edit Campaign Details
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" /> {currentCampaign.name}
            <TooltipProvider>
              {currentCampaign.is_public ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                    Public Campaign
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                    Private Campaign
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            {currentCampaign.description || "No description provided for this campaign."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground space-y-1">
          {currentCampaign.pathway_template_id && currentCampaign.pathway_templates?.name && (
            <p className="flex items-center gap-1">
              <Workflow className="h-4 w-4" />
              Template: <Link href={`/pathway-templates/${currentCampaign.pathway_template_id}`} className="text-primary hover:underline"> {/* Corrected link */}
                {currentCampaign.pathway_templates.name}
              </Link>
            </p>
          )}
          <p className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            Start: {currentCampaign.start_date ? new Date(currentCampaign.start_date).toLocaleDateString() : "N/A"}
          </p>
          <p className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            End: {currentCampaign.end_date ? new Date(currentCampaign.end_date).toLocaleDateString() : "N/A"}
          </p>
          <p>Status: <span className="font-medium capitalize">{currentCampaign.status}</span></p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-8">
        <h2 className="text-headline-large font-bold text-foreground">Campaign Phases</h2>
        {canModifyCampaign && (
          <Button onClick={() => { setEditingPhase(undefined); setIsPhaseFormOpen(true); }} className="rounded-full px-6 py-3 text-label-large">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Phase
          </Button>
        )}
      </div>

      {campaignPhases.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Campaign Phases Defined</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            This campaign currently has no phases. Add phases to define its workflow.
          </CardDescription>
          {canModifyCampaign && (
            <Button onClick={() => { setEditingPhase(undefined); setIsPhaseFormOpen(true); }} className="mt-6 rounded-full px-6 py-3 text-label-large">
              <PlusCircle className="mr-2 h-5 w-5" /> Add First Phase
            </Button>
          )}
        </Card>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="campaign-phases">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {campaignPhases.map((phase, index) => (
                  <CampaignPhaseCard
                    key={phase.id}
                    phase={phase}
                    index={index}
                    onEdit={handleEditPhase}
                    onDelete={handleDeletePhase}
                    onConfigure={handleConfigurePhase}
                    canEditOrDelete={canModifyCampaign}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <CampaignPhaseFormDialog
        isOpen={isPhaseFormOpen}
        onClose={() => setIsPhaseFormOpen(false)}
        campaignId={campaignId}
        initialData={editingPhase}
        onPhaseSaved={handlePhaseSaved}
        nextOrderIndex={campaignPhases.length}
      />

      {/* Campaign Phase Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-headline-small">
              Configure Campaign Phase
            </DialogTitle>
          </DialogHeader>
          {configuringPhase && (
            <CampaignPhaseConfigurationPanel
              phase={configuringPhase}
              campaignId={campaignId}
              onConfigSaved={handleConfigSaved}
              canModify={canModifyCampaign}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}