"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, Workflow, Lock, Globe, Edit, Copy, Save, CheckCircle, Clock, UserCircle2, CalendarDays, Info, X, Trash2, ChevronDown, ChevronUp, Archive, History, Activity, RotateCcw, MoreVertical } from "lucide-react"; // Added MoreVertical for overflow menu
import { PathwayTemplate, Phase, Profile } from "@/types/supabase"; // Import Profile type
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplateByIdAction, getPhasesAction, reorderPhasesAction, deletePhaseAction as deletePhaseActionService, createTemplateVersionAction, publishPathwayTemplateAction, updatePathwayTemplateStatusAction, updatePathwayTemplateAction, createPathwayTemplateAction, deletePathwayTemplateAction, createPhaseAction } from "../actions"; // Corrected deletePhaseAction import
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PhaseBuilderCard } from "./PhaseBuilderCard";
import { CloneTemplateDialog } from "./CloneTemplateDialog";
import { TemplateVersionHistory } from "./TemplateVersionHistory";
import { TemplateActivityLog } from "./TemplateActivityLog";
import { PhaseDetailsForm } from "./PhaseDetailsForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Import Dialog components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProfileByIdAction } from "@/features/user-profile/actions"; // Import getProfileByIdAction


// Zod schema for the entire template builder page (template details + phases)
const templateBuilderSchema = z.object({
  name: z.string().min(1, { message: "Template name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
  is_private: z.boolean(),
  application_open_date: z.date().nullable().optional(),
  participation_deadline: z.date().nullable().optional(),
  general_instructions: z.string().max(5000, { message: "General instructions cannot exceed 5000 characters." }).nullable().optional(),
  is_visible_to_applicants: z.boolean().optional(),
  tags: z.string().nullable().optional(), // New field for tags (comma-separated string)
});

// Schema for the inline phase creation form
const inlinePhaseCreationSchema = z.object({
  name: z.string().min(1, { message: "Phase name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  type: z.string().min(1, { message: "Phase type is required." }),
});

interface PathwayTemplateBuilderPageProps {
  templateId?: string; // Optional for new template creation
  initialTemplate?: PathwayTemplate;
  initialPhases?: Phase[];
}

export function PathwayTemplateBuilderPage({ templateId, initialTemplate, initialPhases }: PathwayTemplateBuilderPageProps) {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [template, setTemplate] = useState<PathwayTemplate | null>(initialTemplate || null);
  const [phases, setPhases] = useState<Phase[]>(initialPhases || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [templateToClone, setTemplateToClone] = useState<PathwayTemplate | null>(null);
  const [isAddingNewPhase, setIsAddingNewPhase] = useState(false);
  const [expandedPhaseIds, setExpandedPhaseIds] = useState<Set<string>>(new Set<string>());
  const [showUnsavedChangesWarning, setShowUnsavedChangesWarning] = useState(false); // State for unsaved changes warning
  const [nextPath, setNextPath] = useState<string | null>(null); // Path to navigate to if changes are discarded
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false); // State for Version History dialog
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false); // State for Activity Log dialog
  const [creatorProfile, setCreatorProfile] = useState<Profile | null>(null); // State for creator's profile
  const [lastUpdaterProfile, setLastUpdaterProfile] = useState<Profile | null>(null); // State for last updater's profile
  const [refreshTrigger, setRefreshTrigger] = useState(0); // New state to trigger refreshes

  const templateForm = useForm<z.infer<typeof templateBuilderSchema>>({
    resolver: zodResolver(templateBuilderSchema),
    defaultValues: {
      name: initialTemplate?.name || "",
      description: initialTemplate?.description || "",
      is_private: initialTemplate?.is_private ?? false,
      application_open_date: initialTemplate?.application_open_date ? new Date(initialTemplate.application_open_date) : null,
      participation_deadline: initialTemplate?.participation_deadline ? new Date(initialTemplate.participation_deadline) : null,
      general_instructions: initialTemplate?.general_instructions || "",
      is_visible_to_applicants: initialTemplate?.is_visible_to_applicants ?? true,
      tags: initialTemplate?.tags?.join(', ') || "", // Convert array to comma-separated string
    },
    mode: "onChange",
  });

  const inlinePhaseForm = useForm<z.infer<typeof inlinePhaseCreationSchema>>({
    resolver: zodResolver(inlinePhaseCreationSchema),
    defaultValues: {
      name: "",
      type: "", // Initialize with empty string
    },
    mode: "onChange", // Ensure validation runs on change
  });

  // Effect to reset and validate inlinePhaseForm when it becomes visible
  useEffect(() => {
    if (isAddingNewPhase) {
      inlinePhaseForm.reset({
        name: "",
        type: "", // Reset to empty string
      });
      // Removed inlinePhaseForm.trigger() from here to avoid potential race conditions
    }
  }, [isAddingNewPhase, inlinePhaseForm]);

  const fetchTemplateAndPhases = useCallback(async () => {
    console.log("[PathwayTemplateBuilderPage] fetchTemplateAndPhases called. templateId:", templateId, "user:", user?.id);
    if (!templateId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedTemplate = await getTemplateByIdAction(templateId);
      if (!fetchedTemplate) {
        toast.error("Pathway template not found or unauthorized.");
        router.push("/pathways");
        return;
      }
      setTemplate(fetchedTemplate);
      templateForm.reset({
        name: fetchedTemplate.name,
        description: fetchedTemplate.description,
        is_private: fetchedTemplate.is_private,
        application_open_date: fetchedTemplate.application_open_date ? new Date(fetchedTemplate.application_open_date) : null,
        participation_deadline: fetchedTemplate.participation_deadline ? new Date(fetchedTemplate.participation_deadline) : null,
        general_instructions: fetchedTemplate.general_instructions || "",
        is_visible_to_applicants: fetchedTemplate.is_visible_to_applicants ?? true,
        tags: fetchedTemplate.tags?.join(', ') || "", // Convert array to comma-separated string
      });

      // Fetch creator and last updater profiles
      const [creatorProfileData, lastUpdaterProfileData] = await Promise.all([
        fetchedTemplate.creator_id ? getProfileByIdAction(fetchedTemplate.creator_id) : Promise.resolve(null),
        fetchedTemplate.last_updated_by ? getProfileByIdAction(fetchedTemplate.last_updated_by) : Promise.resolve(null),
      ]);
      setCreatorProfile(creatorProfileData);
      setLastUpdaterProfile(lastUpdaterProfileData);

      const fetchedPhases = await getPhasesAction(templateId);
      if (fetchedPhases) {
        setPhases(fetchedPhases);
      }
      setRefreshTrigger(prev => prev + 1); // Increment trigger to refresh children
    } catch (error: any) {
      toast.error(error.message || "Failed to load pathway template details.");
      router.push("/pathways");
    } finally {
      setIsLoading(false);
    }
  }, [templateId, router, templateForm, user]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchTemplateAndPhases();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view pathway templates.");
      router.push("/login");
    }
  }, [user, isSessionLoading, fetchTemplateAndPhases]);

  // Unsaved changes warning logic
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (templateForm.formState.isDirty) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [templateForm.formState.isDirty]);

  const handleNavigate = (path: string) => {
    if (templateForm.formState.isDirty) {
      setNextPath(path);
      setShowUnsavedChangesWarning(true);
    } else {
      router.push(path);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesWarning(false);
    if (nextPath) {
      templateForm.reset(); // Reset form to clear dirty state
      router.push(nextPath);
    }
  };

  const handleStayOnPage = () => {
    setShowUnsavedChangesWarning(false);
    setNextPath(null);
  };

  const handleTemplateDetailsSave = async (values: z.infer<typeof templateBuilderSchema>) => {
    // Ensure template is not null for existing templates
    if (templateId && !template) {
      toast.error("Template data is not loaded. Cannot save.");
      return;
    }

    const currentUser = user!; // Safe due to earlier redirect
    const isAdmin = (currentUser.user_metadata?.role || '') === 'admin'; // Fixed: Added parentheses for correct precedence
    const canModify = template ? (template.creator_id === currentUser.id || isAdmin) : true; // For new templates, assume can modify.

    if (!canModify) {
      toast.error("You do not have permission to modify this template.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");
      formData.append("is_private", values.is_private ? "on" : "off");
      formData.append("application_open_date", values.application_open_date ? values.application_open_date.toISOString() : "");
      formData.append("participation_deadline", values.participation_deadline ? values.participation_deadline.toISOString() : "");
      formData.append("general_instructions", values.general_instructions || "");
      formData.append("is_visible_to_applicants", values.is_visible_to_applicants ? "on" : "off");
      formData.append("tags", values.tags || ""); // Append tags as a comma-separated string


      let result: PathwayTemplate | null;
      if (templateId) {
        result = await updatePathwayTemplateAction(templateId, formData);
      } else {
        result = await createPathwayTemplateAction(formData);
      }

      if (result) {
        toast.success(`Template ${templateId ? "updated" : "created"} successfully!`);
        templateForm.reset({
          ...values,
          tags: values.tags || "", // Ensure tags are reset correctly
        }); // Reset form to clear dirty state
        if (!templateId) {
          router.push(`/pathways/${result.id}`);
        } else {
          fetchTemplateAndPhases();
        }
      }
    } catch (error: any) {
      console.error("Template details submission error:", error);
      toast.error(error.message || "Failed to save template details.");
    }
  };

  const handlePhaseUpdated = () => {
    fetchTemplateAndPhases();
    setIsAddingNewPhase(false);
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!templateId) {
      toast.error("Cannot delete phase from a new template.");
      return;
    }
    try {
      const success = await deletePhaseActionService(phaseId, templateId); // Use deletePhaseActionService
      if (success) {
        toast.success("Phase deleted successfully!");
        fetchTemplateAndPhases();
        setExpandedPhaseIds((prev: Set<string>) => {
          const newSet = new Set(prev);
          newSet.delete(phaseId);
          return newSet;
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete phase.");
    }
  };

  const handleReorderPhases = async (result: DropResult) => {
    if (!result.destination || !templateId) {
      return;
    }

    const reorderedPhases = Array.from(phases);
    const [removed] = reorderedPhases.splice(result.source.index, 1);
    reorderedPhases.splice(result.destination.index, 0, removed);

    const updatedPhases = reorderedPhases.map((phase, index) => ({
      ...phase,
      order_index: index,
    }));

    setPhases(updatedPhases);

    try {
      const success = await reorderPhasesAction(
        templateId,
        updatedPhases.map((p: Phase) => ({ id: p.id, order_index: p.order_index }))
      );
      if (!success) {
        toast.error("Failed to reorder phases. Reverting changes.");
        fetchTemplateAndPhases();
      } else {
        toast.success("Phases reordered successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder phases. Reverting changes.");
      fetchTemplateAndPhases();
    }
  };

  const handlePublishTemplate = async () => {
    if (!templateId) {
      toast.error("Cannot publish a new template.");
      return;
    }
    try {
      const publishedVersion = await publishPathwayTemplateAction(templateId);
      if (publishedVersion) {
        toast.success(`Template published and new version ${publishedVersion.version_number} created!`);
        fetchTemplateAndPhases();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to publish template.");
    }
  };

  const handleUpdateStatus = async (newStatus: PathwayTemplate['status']) => {
    if (!templateId) return;
    try {
      const updatedTemplate = await updatePathwayTemplateStatusAction(templateId, newStatus);
      if (updatedTemplate) {
        toast.success(`Template status updated to ${newStatus}!`);
        fetchTemplateAndPhases();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update template status.");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateId) {
      toast.error("Cannot delete a new template.");
      return;
    }
    try {
      const success = await deletePathwayTemplateAction(templateId);
      if (success) {
        toast.success("Template permanently deleted!");
        router.push("/pathways");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template.");
    }
  };

  const handleClone = (templateToClone: PathwayTemplate) => {
    setTemplateToClone(templateToClone);
    setIsCloneDialogOpen(true);
  };

  const handleToggleExpandPhase = (phaseId: string) => {
    setExpandedPhaseIds((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
    setIsAddingNewPhase(false); // Hide inline creator if expanding/collapsing a phase
  };

  const isAllPhasesExpanded = phases.length > 0 && expandedPhaseIds.size === phases.length;

  const handleToggleAllPhases = () => {
    if (isAllPhasesExpanded) {
      handleCollapseAllPhases();
    } else {
      handleExpandAllPhases();
    }
  };

  const handleExpandAllPhases = () => {
    const allPhaseIds = new Set(phases.map(p => p.id));
    setExpandedPhaseIds(allPhaseIds);
    setIsAddingNewPhase(false);
  };

  const handleCollapseAllPhases = () => {
    setExpandedPhaseIds(new Set<string>());
    setIsAddingNewPhase(false);
  };

  const handleInlinePhaseCreate = async (values: z.infer<typeof inlinePhaseCreationSchema>) => {
    console.log("[PathwayTemplateBuilderPage] handleInlinePhaseCreate called with values:", values);
    console.log("[PathwayTemplateBuilderPage] inlinePhaseForm state errors on submit (inside handler):", inlinePhaseForm.formState.errors);
    console.log("[PathwayTemplateBuilderPage] inlinePhaseForm state isValid on submit (inside handler):", inlinePhaseForm.formState.isValid);

    if (!inlinePhaseForm.formState.isValid) {
      console.error("[PathwayTemplateBuilderPage] Form is invalid, preventing API call. Forcing trigger to show errors.");
      inlinePhaseForm.trigger(); // Force validation to display messages
      console.log("[PathwayTemplateBuilderPage] Errors after trigger:", inlinePhaseForm.formState.errors); // NEW LOG
      toast.error("Please correct the errors in the new phase form.");
      return;
    }

    if (!canModifyTemplate || !templateId) {
      toast.error("You do not have permission to add phases.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("description", ""); // Empty string for description is fine for TEXT column
      formData.append("order_index", phases.length.toString());
      // Pass null for optional date/text fields if they are empty
      formData.append("phase_start_date", ""); // Will be handled as null in action if empty
      formData.append("phase_end_date", ""); // Will be handled as null in action if empty
      formData.append("applicant_instructions", ""); // Will be handled as null in action if empty
      formData.append("manager_instructions", ""); // Will be handled as null in action if empty
      formData.append("is_visible_to_applicants", "on");

      const result = await createPhaseAction(templateId, formData);
      if (result) {
        toast.success(`Phase "${result.name}" created successfully!`);
        handlePhaseUpdated();
        inlinePhaseForm.reset();
      }
    } catch (error: any) {
      console.error("Inline phase creation error:", error);
      toast.error(error.message || "Failed to create phase.");
    }
  };

  const isNewTemplate = !templateId;

  if (isLoading || isSessionLoading || (!templateId && !user)) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
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
  const canModifyTemplate: boolean = template ? (template.creator_id === currentUser.id || isAdmin) : true;


  const phaseTypes = [
    { value: "Form", label: "Form" },
    { value: "Review", label: "Review" },
    { value: "Email", label: "Email" },
    { value: "Scheduling", label: "Scheduling" },
    { value: "Decision", label: "Decision" },
    { value: "Recommendation", label: "Recommendation" },
    { value: "Screening", label: "Screening" },
  ];

  const getStatusBadge = (status: PathwayTemplate['status']) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
      case 'published': return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Published</Badge>;
      case 'archived': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Archive className="h-3 w-3 mr-1" /> Archived</Badge>;
      default: return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">Unknown</Badge>;
    }
  };

  const getProfileDisplayName = (profile: Profile | null) => {
    if (!profile) return "Unknown User";
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Unknown User";
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href="#" onClick={() => handleNavigate("/pathways")}>
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Templates
          </Link>
        </Button>
      </div>

      <h1 className="text-display-small font-bold text-foreground flex items-center gap-4">
        {isNewTemplate ? "Create New Pathway Template" : `Edit Pathway Template: ${template?.name || 'Loading...'}`}
        {!isNewTemplate && getStatusBadge(currentTemplate.status)}
      </h1>

      <Form {...templateForm}>
        <form onSubmit={templateForm.handleSubmit(handleTemplateDetailsSave)} className="space-y-8">
          {/* Template Basics Card - Always render for new or existing templates */}
          <Card className="rounded-xl shadow-lg p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-headline-large font-bold text-foreground flex items-center gap-2">
                Template Basics
                {!isNewTemplate && (
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
                )}
              </CardTitle>
              <CardDescription className="text-body-large text-muted-foreground">
                Define the core identity and visibility of this pathway template.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <FormField
                control={templateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Global Fellowship Application" {...field} className="rounded-md" disabled={!canModifyTemplate} />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      A unique and descriptive name for your pathway template.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Template Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a brief overview of this pathway template's purpose."
                        className="resize-y min-h-[80px] rounded-md"
                        {...field}
                        value={field.value || ""}
                        disabled={!canModifyTemplate}
                      />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      Optional: A detailed description of what this template is used for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Tags (Comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., fellowship, global, application" {...field} className="rounded-md" disabled={!canModifyTemplate} value={field.value || ""} />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      Add tags to categorize and organize your templates (e.g., "hiring", "awards", "fellowship").
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="is_private"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-label-large">Keep Private</FormLabel>
                      <FormDescription className="text-body-small">
                        If enabled, this template will only be visible to you and platform administrators.
                        Otherwise, it will be visible to all workbench users.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
                        disabled={!canModifyTemplate}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Essential Information Card - Always render for new or existing templates */}
          <Card className="rounded-xl shadow-lg p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-headline-large font-bold text-foreground">
                Essential Information
              </CardTitle>
              <CardDescription className="text-body-large text-muted-foreground">
                Key dates and general instructions for applicants.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={templateForm.control}
                  name="application_open_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-label-large">Application Open Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={!canModifyTemplate}>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal rounded-md",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl shadow-lg bg-card text-card-foreground border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-body-small">
                        The date when applications for campaigns using this template will open.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={templateForm.control}
                  name="participation_deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-label-large">Participation Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={!canModifyTemplate}>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal rounded-md",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl shadow-lg bg-card text-card-foreground border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-body-small">
                        The final date for applicants to submit their participation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={templateForm.control}
                name="general_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">General Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide general instructions or guidelines for applicants."
                        className="resize-y min-h-[150px] rounded-md"
                        {...field}
                        value={field.value || ""}
                        disabled={!canModifyTemplate}
                      />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      These instructions will be visible to applicants. (Rich text editor integration coming soon)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons for Template Details */}
          <CardFooter className="flex flex-wrap justify-end items-center gap-2 mt-8 pt-6 border-t border-border">
            {canModifyTemplate && (
              <Button type="submit" variant="tonal" className="rounded-full px-6 py-3 text-label-large" disabled={templateForm.formState.isSubmitting}>
                {templateForm.formState.isSubmitting ? "Saving..." : <><Save className="mr-2 h-5 w-5" /> Save Template Details</>}
              </Button>
            )}
            {!isNewTemplate && canModifyTemplate && (
              <>
                {/* Publish Template */}
                <Button variant="default" className="rounded-full px-6 py-3 text-label-large" onClick={handlePublishTemplate} disabled={currentTemplate.status === 'published'}>
                  <CheckCircle className="mr-2 h-5 w-5" /> {currentTemplate.status === 'published' ? "Published" : "Publish Template"}
                </Button>

                {/* More Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <MoreVertical className="h-5 w-5" />
                      <span className="sr-only">More actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                    <DropdownMenuLabel className="text-body-medium">More Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />

                    {/* Clone Template */}
                    <DropdownMenuItem onSelect={() => handleClone(currentTemplate)} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                      <Copy className="mr-2 h-4 w-4" /> Clone Template
                    </DropdownMenuItem>

                    {/* Archive / Unarchive Template */}
                    {currentTemplate.status === 'archived' ? (
                      <DropdownMenuItem onSelect={() => handleUpdateStatus('draft')} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                        <RotateCcw className="mr-2 h-4 w-4" /> Unarchive
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={() => handleUpdateStatus('archived')} className="text-body-medium text-destructive hover:bg-destructive-container hover:text-destructive cursor-pointer">
                        <Archive className="mr-2 h-4 w-4" /> Archive Template
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator className="bg-border" />

                    {/* Delete Template */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()} className="text-body-medium text-destructive hover:bg-destructive-container hover:text-destructive cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Template
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-headline-small">Confirm Permanent Deletion</AlertDialogTitle>
                          <AlertDialogDescription className="text-body-medium text-muted-foreground">
                            Are you sure you want to permanently delete the "{currentTemplate.name}" pathway template? This action cannot be undone and will remove all associated phases and data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={handleStayOnPage} className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteTemplate}
                            className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </CardFooter>
        </form>
      </Form>

      {/* Only show phases section if template exists (i.e., not a brand new template being created) */}
      {!isNewTemplate && template && (
        <>
          <div className="flex justify-between items-center mt-8">
            <h2 className="text-headline-large font-bold text-foreground">Pathway Phases</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-full px-6 py-3 text-label-large"
                onClick={handleToggleAllPhases}
                disabled={phases.length === 0}
              >
                {isAllPhasesExpanded ? <><ChevronUp className="mr-2 h-5 w-5" /> Collapse All</> : <><ChevronDown className="mr-2 h-5 w-5" /> Expand All</>}
              </Button>
              {canModifyTemplate && (
                <Button onClick={() => setIsAddingNewPhase(prev => !prev)} className="rounded-full px-6 py-3 text-label-large">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add New Phase
                </Button>
              )}
            </div>
          </div>

          {isAddingNewPhase && canModifyTemplate && (
            <Card className="rounded-xl shadow-lg p-6 bg-muted/20 border border-border">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-headline-small font-bold text-foreground">Quick Add Phase</CardTitle>
                <CardDescription className="text-body-medium text-muted-foreground">
                  Add a new phase to your pathway template. You can configure it later.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Form {...inlinePhaseForm}>
                  <form onSubmit={inlinePhaseForm.handleSubmit(handleInlinePhaseCreate)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={inlinePhaseForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-label-large">Phase Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Initial Application" {...field} className="rounded-md" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={inlinePhaseForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-label-large">Phase Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-md">
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                              {phaseTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end">
                      <Button type="submit" className="w-full rounded-md text-label-large" disabled={inlinePhaseForm.formState.isSubmitting}>
                        {inlinePhaseForm.formState.isSubmitting ? "Adding..." : "Add Phase"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {phases.length === 0 && !isAddingNewPhase ? (
            <Card className="rounded-xl shadow-md p-8 text-center">
              <CardTitle className="text-headline-small text-muted-foreground mb-4">No Phases Defined</CardTitle>
              <CardDescription className="text-body-medium text-muted-foreground">
                This pathway template currently has no phases. Add phases to define its workflow.
              </CardDescription>
              {canModifyTemplate && (
                <Button onClick={() => setIsAddingNewPhase(true)} className="mt-6 rounded-full px-6 py-3 text-label-large">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add First Phase
                </Button>
              )}
            </Card>
          ) : (
            <DragDropContext onDragEnd={handleReorderPhases}>
              <Droppable droppableId="pathway-phases">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {phases.map((phase: Phase, index: number) => (
                      <PhaseBuilderCard
                        key={phase.id}
                        phase={phase}
                        index={index}
                        onDelete={handleDeletePhase}
                        onPhaseUpdated={handlePhaseUpdated}
                        canModify={canModifyTemplate}
                        isExpanded={expandedPhaseIds.has(phase.id)}
                        onToggleExpand={handleToggleExpandPhase}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          <CardFooter className="flex flex-col md:flex-row md:justify-between md:items-center text-body-small text-muted-foreground border-t border-border pt-6 mt-8">
            <div className="flex flex-col items-start mb-4 md:mb-0">
              <p>
                Created by{" "}
                <span className="font-medium">
                  {getProfileDisplayName(creatorProfile)}
                </span>{" "}
                on {format(new Date(currentTemplate.created_at), "MMM dd, yyyy 'at' HH:mm:ss (zzz)")}
              </p>
              <p>
                Last updated by{" "}
                <span className="font-medium">
                  {getProfileDisplayName(lastUpdaterProfile)}
                </span>{" "}
                on {format(new Date(currentTemplate.updated_at), "MMM dd, yyyy 'at' HH:mm:ss (zzz)")}
              </p>
            </div>
            <div className="flex flex-wrap justify-end items-center gap-2">
              {/* Version History Trigger */}
              <Button variant="outline" className="rounded-full px-6 py-3 text-label-large" onClick={() => setIsVersionHistoryOpen(true)}>
                <History className="mr-2 h-5 w-5" /> Version History
              </Button>
              {/* Activity Log Trigger */}
              <Button variant="outline" className="rounded-full px-6 py-3 text-label-large" onClick={() => setIsActivityLogOpen(true)}>
                <Activity className="mr-2 h-5 w-5" /> Activity Log
              </Button>
            </div>
          </CardFooter>
        </>
      )}

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedChangesWarning} onOpenChange={setShowUnsavedChangesWarning}>
        <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-headline-small">Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription className="text-body-medium text-muted-foreground">
              You have unsaved changes. Do you want to discard them and leave this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStayOnPage} className="rounded-md text-label-large">Stay on Page</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardChanges}
              className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clone Template Dialog */}
      {templateToClone && (
        <CloneTemplateDialog
          isOpen={isCloneDialogOpen}
          onClose={() => { setIsCloneDialogOpen(false); setTemplateToClone(null); fetchTemplateAndPhases(); }}
          templateId={templateToClone.id}
          originalTemplateName={templateToClone.name}
        />
      )}

      {/* Version History Dialog */}
      {templateId && (
        <Dialog open={isVersionHistoryOpen} onOpenChange={setIsVersionHistoryOpen}>
          <DialogContent className="sm:max-w-[900px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-headline-small">Template Version History</DialogTitle>
              <DialogDescription className="text-body-medium text-muted-foreground">
                View and manage past versions of this pathway template.
              </DialogDescription>
            </DialogHeader>
            <TemplateVersionHistory
              pathwayTemplateId={templateId}
              canModify={canModifyTemplate}
              onTemplateRolledBack={fetchTemplateAndPhases}
              refreshTrigger={refreshTrigger}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Activity Log Dialog */}
      {templateId && (
        <Dialog open={isActivityLogOpen} onOpenChange={setIsActivityLogOpen}>
          <DialogContent className="sm:max-w-[900px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-headline-small">Template Activity Log</DialogTitle>
              <DialogDescription className="text-body-medium text-muted-foreground">
                A chronological record of all changes and events for this template.
              </DialogDescription>
            </DialogHeader>
            <TemplateActivityLog
              templateId={templateId}
              refreshTrigger={refreshTrigger}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}