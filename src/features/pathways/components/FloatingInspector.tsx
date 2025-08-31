"use client";

import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, Settings, Info, ListChecks, GitFork, History } from "lucide-react";
import { PathwayTemplate, Phase } from "../services/pathway-template-service";
import { PhaseDetailsForm } from "./PhaseDetailsForm";
import { PhaseConfigurationPanel } from "./PhaseConfigurationPanel";
import { PhaseTaskManagementPanel } from "./PhaseTaskManagementPanel";
import { BranchingConfigForm } from "./BranchingConfigForm";
import { TemplateActivityLog } from "./TemplateActivityLog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/context/SessionContextProvider";
import { getProfileByIdAction } from "@/features/user-profile/actions";
import { Profile } from "@/types/supabase";

interface FloatingInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  phase: Phase;
  template: PathwayTemplate;
  canModifyTemplate: boolean;
  onPhaseUpdated: () => void; // Callback to refresh parent data
}

export function FloatingInspector({
  isOpen,
  onClose,
  phase,
  template,
  canModifyTemplate,
  onPhaseUpdated,
}: FloatingInspectorProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [defaultActiveTab, setDefaultActiveTab] = useState("details");

  // Determine default active tab dynamically
  useEffect(() => {
    if (phase) {
      switch (phase.type) {
        case "Form":
        case "Review":
        case "Email":
        case "Scheduling":
        case "Decision":
        case "Recommendation":
          setDefaultActiveTab("config");
          break;
        default:
          setDefaultActiveTab("details");
      }
    }
  }, [phase]);

  const handleSaveAndClose = () => {
    onPhaseUpdated(); // Trigger parent refresh
    onClose(); // Close the inspector
  };

  const handleCancelAndClose = () => {
    onClose(); // Close the inspector without saving
  };

  const isConditional = phase.type === "Decision" || phase.type === "Review";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col rounded-l-xl shadow-lg bg-card text-card-foreground border-border">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-headline-small flex items-center justify-between">
            <span>{phase.name} ({phase.type})</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
              <span className="sr-only">Close Inspector</span>
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto p-4">
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
              {isConditional && (
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
                  initialData={phase}
                  onPhaseSaved={handleSaveAndClose}
                  onCancel={handleCancelAndClose}
                  nextOrderIndex={phase.order_index}
                  canModify={canModifyTemplate}
                />
              </TabsContent>
              <TabsContent value="config">
                <PhaseConfigurationPanel
                  phase={phase}
                  parentId={template.id}
                  onConfigSaved={handleSaveAndClose}
                  canModify={canModifyTemplate}
                />
              </TabsContent>
              <TabsContent value="tasks">
                <PhaseTaskManagementPanel
                  phaseId={phase.id}
                  pathwayTemplateId={template.id}
                  canModify={canModifyTemplate}
                />
              </TabsContent>
              {isConditional && (
                <TabsContent value="branching">
                  <BranchingConfigForm
                    pathwayTemplateId={template.id}
                    phase={phase}
                    onConfigSaved={handleSaveAndClose}
                    canModify={canModifyTemplate}
                  />
                </TabsContent>
              )}
              <TabsContent value="activity">
                <TemplateActivityLog templateId={template.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}