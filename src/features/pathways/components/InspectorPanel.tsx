"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, Settings, Info, ListChecks, GitFork, History } from "lucide-react";
import { PathwayTemplate, Phase } from "../services/pathway-template-service";
import { PathwayTemplateForm } from "./PathwayTemplateForm";
import { PhaseDetailsForm } from "./PhaseDetailsForm"; // Renamed from PhaseFormDialog
import { PhaseConfigurationPanel } from "./PhaseConfigurationPanel";
import { PhaseTaskManagementPanel } from "./PhaseTaskManagementPanel";
import { TemplateVersionHistory } from "./TemplateVersionHistory";
import { TemplateActivityLog } from "./TemplateActivityLog"; // New Activity Log component
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/context/SessionContextProvider";
import { getProfileByIdAction } from "@/features/user-profile/actions";
import { Profile } from "@/types/supabase";
import { BranchingConfigForm } from "./BranchingConfigForm"; // Import BranchingConfigForm

interface InspectorPanelProps {
  template: PathwayTemplate;
  phases: Phase[];
  selectedPhaseId: string | null;
  isEditingTemplateDetails: boolean;
  onClose: () => void;
  onSelectPhase: (phaseId: string) => void;
  onEditTemplateDetails: () => void;
  canModifyTemplate: boolean;
}

export function InspectorPanel({
  template,
  phases,
  selectedPhaseId,
  isEditingTemplateDetails,
  onClose,
  onSelectPhase,
  onEditTemplateDetails,
  canModifyTemplate,
}: InspectorPanelProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [creatorProfile, setCreatorProfile] = useState<Profile | null>(null);
  const [lastUpdaterProfile, setLastUpdaterProfile] = useState<Profile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [defaultActiveTab, setDefaultActiveTab] = useState("details"); // State for dynamic default tab

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoadingProfiles(true);
      const fetchedProfiles: { [key: string]: Profile | null } = {};
      const userIdsToFetch = new Set<string>();

      if (template.creator_id) userIdsToFetch.add(template.creator_id);
      if (template.last_updated_by) userIdsToFetch.add(template.last_updated_by);

      for (const userId of Array.from(userIdsToFetch)) {
        try {
          const profile = await getProfileByIdAction(userId);
          fetchedProfiles[userId] = profile;
        } catch (error) {
          console.error(`Failed to fetch profile for user ${userId}:`, error);
          fetchedProfiles[userId] = null;
        }
      }

      setCreatorProfile(fetchedProfiles[template.creator_id] || null);
      setLastUpdaterProfile(fetchedProfiles[template.last_updated_by || ''] || null);
      setIsLoadingProfiles(false);
    };

    if (!isSessionLoading && user) {
      fetchProfiles();
    }
  }, [template, isSessionLoading, user]);

  const selectedPhase = selectedPhaseId === "new"
    ? undefined // For new phase creation
    : phases.find(p => p.id === selectedPhaseId);

  // Determine default active tab dynamically
  useEffect(() => {
    if (isEditingTemplateDetails) {
      setDefaultActiveTab("details");
    } else if (selectedPhase) {
      switch (selectedPhase.type) {
        case "Form":
        case "Review":
        case "Email":
        case "Scheduling":
        case "Decision":
        case "Recommendation":
          setDefaultActiveTab("config"); // For configurable phases, default to config
          break;
        default:
          setDefaultActiveTab("details"); // Fallback to details
      }
    } else {
      setDefaultActiveTab("details"); // Default if nothing selected
    }
  }, [selectedPhase, isEditingTemplateDetails]);

  const nextOrderIndex = phases.length;

  const renderContent = () => {
    if (isEditingTemplateDetails) {
      return (
        <Tabs defaultValue="details" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-1 h-auto rounded-xl shadow-md bg-card text-card-foreground border-border p-1 mb-4">
            <TabsTrigger value="details" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
              Template Details
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="flex-grow overflow-y-auto">
            <PathwayTemplateForm
              initialData={template}
              onTemplateSaved={onClose} // Close inspector and refresh parent
              onCancel={onClose} // Close inspector
              canModify={canModifyTemplate}
            />
          </TabsContent>
        </Tabs>
      );
    }

    if (selectedPhaseId) {
      return (
        <Tabs defaultValue={defaultActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-5 h-auto rounded-xl shadow-md bg-card text-card-foreground border-border p-1 mb-4">
            <TabsTrigger value="details" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
              Details
            </TabsTrigger>
            <TabsTrigger value="config" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
              Config
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
              Tasks
            </TabsTrigger>
            {(selectedPhase?.type === "Decision" || selectedPhase?.type === "Review") && (
              <TabsTrigger value="branching" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
                Branching
              </TabsTrigger>
            )}
            <TabsTrigger value="activity" className="text-label-large data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-lg">
              Activity
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto">
            <TabsContent value="details">
              <PhaseDetailsForm
                pathwayTemplateId={template.id}
                initialData={selectedPhase}
                onPhaseSaved={onClose}
                onCancel={onClose}
                nextOrderIndex={nextOrderIndex}
                canModify={canModifyTemplate}
              />
            </TabsContent>
            <TabsContent value="config">
              {selectedPhase && (
                <PhaseConfigurationPanel
                  phase={selectedPhase}
                  parentId={template.id}
                  onConfigSaved={onClose}
                  canModify={canModifyTemplate}
                />
              )}
            </TabsContent>
            <TabsContent value="tasks">
              {selectedPhase && (
                <PhaseTaskManagementPanel
                  phaseId={selectedPhase.id}
                  pathwayTemplateId={template.id}
                  canModify={canModifyTemplate}
                />
              )}
            </TabsContent>
            {(selectedPhase?.type === "Decision" || selectedPhase?.type === "Review") && (
              <TabsContent value="branching">
                {selectedPhase && (
                  <BranchingConfigForm
                    pathwayTemplateId={template.id}
                    phase={selectedPhase}
                    onConfigSaved={onClose}
                    canModify={canModifyTemplate}
                  />
                )}
              </TabsContent>
            )}
            <TabsContent value="activity">
              <TemplateActivityLog templateId={template.id} />
            </TabsContent>
          </div>
        </Tabs>
      );
    }

    return (
      <div className="p-6 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
        <Info className="h-12 w-12 mb-4" />
        <h3 className="text-headline-small font-bold mb-2">Select an Item to Configure</h3>
        <p className="text-body-medium mb-4">
          Click on a phase in the workflow canvas or edit template details to get started.
        </p>
        {canModifyTemplate && (
          <Button variant="outlined" onClick={onEditTemplateDetails} className="rounded-md text-label-large">
            <Settings className="mr-2 h-4 w-4" /> Edit Template Details
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-title-large font-bold text-foreground">
          {isEditingTemplateDetails ? "Template Settings" : selectedPhase ? `${selectedPhase.name} (${selectedPhase.type})` : "Inspector"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-5 w-5" />
          <span className="sr-only">Close Inspector</span>
        </Button>
      </div>
      <div className="p-4 flex-grow overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}