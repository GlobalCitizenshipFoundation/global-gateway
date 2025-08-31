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
  // Removed isBranchingDialogOpen and branchingPhase states

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
    }<ctrl63>