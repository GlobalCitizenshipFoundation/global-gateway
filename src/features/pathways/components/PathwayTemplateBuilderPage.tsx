"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, Workflow, Lock, Globe, Edit, Copy, Save, CheckCircle, Clock, UserCircle2, CalendarDays, Info, X, Trash2 } from "lucide-react";
import { PathwayTemplate, Phase } from "@/types/supabase";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplateByIdAction, getPhasesAction, reorderPhasesAction, deletePhaseAction, createTemplateVersionAction, publishPathwayTemplateAction, updatePathwayTemplateStatusAction, updatePathwayTemplateAction, createPathwayTemplateAction, createPhaseAction, deletePathwayTemplateAction } from "../actions";
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

// Zod schema for the entire template builder page (template details + phases)
const templateBuilderSchema = z.object({
  name: z.string().min(1, { message: "Template name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
  is_private: z.boolean(),
  status: z.enum(['draft', 'pending_review', 'published', 'archived']),
  application_open_date: z.date().nullable().optional(),
  participation_deadline: z.date().nullable().optional(),
  general_instructions: z.string().max(5000, { message: "General instructions cannot exceed 5000 characters." }).nullable().optional(),
  applicant_instructions: z.string().max(5000, { message: "Applicant instructions cannot exceed 5000 characters." }).nullable().optional(),
  manager_instructions: z.string().max(5000, { message: "Manager instructions cannot exceed 5000 characters." }).nullable().optional(),
  is_visible_to_applicants: z.boolean().optional(),
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
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(null);

  const templateForm = useForm<z.infer<typeof templateBuilderSchema>>({
    resolver: zodResolver(templateBuilderSchema),
    defaultValues: {
      name: initialTemplate?.name || "",
      description: initialTemplate?.description || "",
      is_private: initialTemplate?.is_private ?? false,
      status: initialTemplate?.status || "draft",
      application_open_date: initialTemplate?.application_open_date ? new Date(initialTemplate.application_open_date) : null,
      participation_deadline: initialTemplate?.participation_deadline ? new Date(initialTemplate.participation_deadline) : null,
      general_instructions: initialTemplate?.general_instructions || "",
      applicant_instructions: initialTemplate?.applicant_instructions || "",
      manager_instructions: initialTemplate?.manager_instructions || "",
      is_visible_to_applicants: initialTemplate?.is_visible_to_applicants ?? true,
    },
    mode: "onChange",
  });

  const inlinePhaseForm = useForm<z.infer<typeof inlinePhaseCreationSchema>>({
    resolver: zodResolver(inlinePhaseCreationSchema),
    defaultValues: {
      name: "",
      type: "",
    },
  });

  const fetchTemplateAndPhases = useCallback(async () => {
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
        status: fetchedTemplate.status,
        application_open_date: fetchedTemplate.application_open_date ? new Date(fetchedTemplate.application_open_date) : null,
        participation_deadline: fetchedTemplate.participation_deadline ? new Date(fetchedTemplate.participation_deadline) : null,
        general_instructions: fetchedTemplate.general_instructions || "",
        applicant_instructions: fetchedTemplate.applicant_instructions || "",
        manager_instructions: fetchedTemplate.manager_instructions || "",
        is_visible_to_applicants: fetchedTemplate.is_visible_to_applicants ?? true,
      });

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
  }, [templateId, router, templateForm]);

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchTemplateAndPhases();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view pathway templates.");
      router.push("/login");
    }
  }, [user, isSessionLoading, fetchTemplateAndPhases]);

  const handleTemplateDetailsSave = async (values: z.infer<typeof templateBuilderSchema>) => {
    if (!canModifyTemplate) {
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
      formData.append("applicant_instructions", values.applicant_instructions || "");
      formData.append("manager_instructions", values.manager_instructions || "");
      formData.append("is_visible_to_applicants", values.is_visible_to_applicants ? "on" : "off");


      let result: PathwayTemplate | null;
      if (templateId) {
        result = await updatePathwayTemplateAction(templateId, formData);
        if (template?.status !== values.status) {
          await updatePathwayTemplateStatusAction(templateId, values.status);
          if (values.status === 'published') {
            await createTemplateVersionAction(templateId);
          }
        }
      } else {
        result = await createPathwayTemplateAction(formData);
        if (result && values.status !== 'draft') {
          await updatePathwayTemplateStatusAction(result.id, values.status);
          if (values.status === 'published') {
            await createTemplateVersionAction(result.id);
          }
        }
      }

      if (result) {
        toast.success(`Template ${templateId ? "updated" : "created"} successfully!`);
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
    setExpandedPhaseId(null);
    setIsAddingNewPhase(false);
  };

  const handleDeletePhase = async (phaseId: string) => {
    try {
      const success = await deletePhaseAction(phaseId, templateId!);
      if (success) {
        toast.success("Phase deleted successfully!");
        fetchTemplateAndPhases();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete phase.");
    }
  };

  const handleReorderPhases = async (result: DropResult) => {
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

    setPhases(updatedPhases);

    try {
      const success = await reorderPhasesAction(
        templateId!,
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

  const handleCreateVersion = async () => {
    try {
      const newVersion = await createTemplateVersionAction(templateId!);
      if (newVersion) {
        toast.success(`New version ${newVersion.version_number} created!`);
        fetchTemplateAndPhases();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create new version.");
    }
  };

  const handlePublishTemplate = async () => {
    try {
      const publishedVersion = await publishPathwayTemplateAction(templateId!);
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
    try {
      const success = await deletePathwayTemplateAction(templateId!);
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
    setExpandedPhaseId(prevId => (prevId === phaseId ? null : phaseId));
    setIsAddingNewPhase(false);
  };

  const handleInlinePhaseCreate = async (values: z.infer<typeof inlinePhaseCreationSchema>) => {
    if (!canModifyTemplate || !templateId) {
      toast.error("You do not have permission to add phases.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("description", "");
      formData.append("order_index", phases.length.toString());
      formData.append("phase_start_date", "");
      formData.append("phase_end_date", "");
      formData.append("applicant_instructions", "");
      formData.append("manager_instructions", "");
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
  const canModifyTemplate: boolean = (templateId && currentTemplate.creator_id === currentUser.id) || isAdmin;
  const isNewTemplate = !templateId;

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "pending_review", label: "Pending Review" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" },
  ];

  const phaseTypes = [
    { value: "Form", label: "Form" },
    { value: "Review", label: "Review" },
    { value: "Email", label: "Email" },
    { value: "Scheduling", label: "Scheduling" },
    { value: "Decision", label: "Decision" },
    { value: "Recommendation", label: "Recommendation" },
    { value: "Screening", label: "Screening" },
  ];

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href="/pathways">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Templates
          </Link>
        </Button>
        <div className="flex space-x-2">
          {templateId && canModifyTemplate && (
            <>
              <Button variant="outlined" className="rounded-full px-6 py-3 text-label-large" onClick={() => handleClone(currentTemplate)}>
                <Copy className="mr-2 h-5 w-5" /> Clone Template
              </Button>
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-full px-6 py-3 text-label-large">
                    <Trash2 className="mr-2 h-5 w-5" /> Delete Template
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-headline-small">Confirm Permanent Deletion</AlertDialogTitle>
                    <AlertDialogDescription className="text-body-medium text-muted-foreground">
                      Are you sure you want to permanently delete the &quot;{currentTemplate.name}&quot; pathway template? This action cannot be undone and will remove all associated phases and data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteTemplate}
                      className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <h1 className="text-display-small font-bold text-foreground">
        {isNewTemplate ? "Create New Pathway Template" : `Edit Pathway Template: ${currentTemplate.name}`}
      </h1>

      <Form {...templateForm}>
        <form onSubmit={templateForm.handleSubmit(handleTemplateDetailsSave)} className="space-y-8">
          {/* Template Basics Card */}
          <Card className="rounded-xl shadow-lg p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-headline-large font-bold text-foreground flex items-center gap-2">
                Template Basics
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
              <FormField
                control={templateForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Template Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canModifyTemplate}>
                      <FormControl>
                        <SelectTrigger className="rounded-md">
                          <SelectValue placeholder="Select template status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-body-small">
                      The current lifecycle status of the template.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Essential Information Card */}
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
                              variant="outlined"
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
                              variant="outlined"
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
              <FormField
                control={templateForm.control}
                name="applicant_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Applicant Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Instructions specifically for applicants regarding the entire template."
                        className="resize-y min-h-[80px] rounded-md"
                        {...field}
                        value={field.value || ""}
                        disabled={!canModifyTemplate}
                      />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      These instructions are visible to applicants in their portal for the overall template.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="manager_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Manager Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Instructions specifically for managers/recruiters regarding the entire template."
                        className="resize-y min-h-[80px] rounded-md"
                        {...field}
                        value={field.value || ""}
                        disabled={!canModifyTemplate}
                      />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      These instructions are for internal staff only (e.g., hiring managers, recruiters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="is_visible_to_applicants"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-label-large">Visible to Applicants (Overall Template)</FormLabel>
                      <FormDescription className="text-body-small">
                        Control whether this entire template is visible to applicants in their portal.
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

          {/* Save Template Details Button */}
          {canModifyTemplate && (
            <Button type="submit" className="w-full rounded-md text-label-large" disabled={templateForm.formState.isSubmitting}>
              {templateForm.formState.isSubmitting ? "Saving Template Details..." : "Save Template Details"}
            </Button>
          )}
        </form>
      </Form>

      {/* Phases Section */}
      <div className="flex justify-between items-center mt-8">
        <h2 className="text-headline-large font-bold text-foreground">Phases</h2>
        {templateId && canModifyTemplate && (
          <Button onClick={() => setIsAddingNewPhase(true)} className="rounded-full px-6 py-3 text-label-large">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Phase
          </Button>
        )}
      </div>

      {phases.length === 0 && !isAddingNewPhase ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Phases Defined</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            This template currently has no phases. Add phases to define its workflow.
          </CardDescription>
          {templateId && canModifyTemplate && (
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
                    isExpanded={expandedPhaseId === phase.id}
                    onToggleExpand={handleToggleExpandPhase}
                  />
                ))}
                {provided.placeholder}

                {/* Inline Phase Creation Form */}
                {isAddingNewPhase && templateId && canModifyTemplate && (
                  <Card className="rounded-xl shadow-lg p-6 border-l-8 border-primary bg-primary-container/10">
                    <h3 className="text-title-large font-bold text-foreground mb-4">New Phase Details</h3>
                    <Form {...inlinePhaseForm}>
                      <form onSubmit={inlinePhaseForm.handleSubmit(handleInlinePhaseCreate)} className="grid gap-4 py-4">
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
                                    <SelectValue placeholder="Select a phase type" />
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
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outlined" onClick={() => setIsAddingNewPhase(false)} className="rounded-md text-label-large">
                            <X className="mr-2 h-4 w-4" /> Cancel
                          </Button>
                          <Button type="submit" className="rounded-md text-label-large" disabled={inlinePhaseForm.formState.isSubmitting}>
                            {inlinePhaseForm.formState.isSubmitting ? "Creating..." : <><PlusCircle className="mr-2 h-5 w-5" /> Create Phase</>}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </Card>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Version History and Activity Log */}
      {templateId && (
        <>
          <TemplateVersionHistory
            pathwayTemplateId={templateId}
            canModify={canModifyTemplate}
            onTemplateRolledBack={handlePhaseUpdated}
          />
          <TemplateActivityLog templateId={templateId} />
        </>
      )}

      {/* Clone Template Dialog */}
      {templateToClone && (
        <CloneTemplateDialog
          isOpen={isCloneDialogOpen}
          onClose={() => { setIsCloneDialogOpen(false); setTemplateToClone(null); fetchTemplateAndPhases(); }}
          templateId={templateToClone.id}
          originalTemplateName={templateToClone.name}
        />
      )}

      {/* Footer Metadata */}
      {templateId && (
        <CardFooter className="flex flex-col items-start text-body-small text-muted-foreground border-t border-border pt-6 mt-8">
          <p>Created by: {currentTemplate.creator_id} on {new Date(currentTemplate.created_at).toLocaleDateString()}</p>
          <p>Last updated by: {currentTemplate.last_updated_by} on {new Date(currentTemplate.updated_at).toLocaleDateString()}</p>
        </CardFooter>
      )}
    </div>
  );
}