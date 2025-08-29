"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Campaign, Program } from "@/features/campaigns/services/campaign-service"; // Import Program interface
import { createCampaignAction, updateCampaignAction } from "@/features/campaigns/actions";
import { getTemplatesAction } from "@/features/pathway-templates/actions";
import { PathwayTemplate } from "@/features/pathway-templates/services/pathway-template-service";
import { getProgramsAction } from "@/features/programs/actions"; // Import getProgramsAction
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, { message: "Campaign name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
  pathway_template_id: z.string().uuid("Invalid template ID.").nullable(),
  program_id: z.string().uuid("Invalid program ID.").nullable(), // Added program_id
  start_date: z.date().nullable(),
  end_date: z.date().nullable(),
  is_public: z.boolean(),
  status: z.enum(['draft', 'active', 'archived', 'completed'], { message: "Invalid campaign status." }),
  config: z.any().optional(), // Flexible for JSONB
}).refine((data) => {
  if (data.start_date && data.end_date && data.start_date > data.end_date) {
    return false;
  }
  return true;
}, {
  message: "End date cannot be before start date.",
  path: ["end_date"],
});

interface CampaignFormProps {
  initialData?: Campaign;
}

export function CampaignForm({ initialData }: CampaignFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // Use searchParams to get URL parameters
  const [pathwayTemplates, setPathwayTemplates] = useState<PathwayTemplate[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]); // State for programs
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [isProgramsLoading, setIsProgramsLoading] = useState(true); // State for programs loading

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      pathway_template_id: initialData?.pathway_template_id || null,
      program_id: initialData?.program_id || searchParams.get('programId') || null, // Pre-fill from URL or initialData
      start_date: initialData?.start_date ? new Date(initialData.start_date) : null,
      end_date: initialData?.end_date ? new Date(initialData.end_date) : null,
      is_public: initialData?.is_public ?? false,
      status: initialData?.status || "draft",
      config: initialData?.config || {},
    },
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsTemplatesLoading(true);
      try {
        const templates = await getTemplatesAction();
        if (templates) {
          setPathwayTemplates(templates);
        }
      } catch (error) {
        console.error("Failed to fetch pathway templates:", error);
        toast.error("Failed to load pathway templates for selection.");
      } finally {
        setIsTemplatesLoading(false);
      }
    };
    fetchTemplates();

    const fetchPrograms = async () => {
      setIsProgramsLoading(true);
      try {
        const fetchedPrograms = await getProgramsAction();
        if (fetchedPrograms) {
          setPrograms(fetchedPrograms);
        }
      } catch (error) {
        console.error("Failed to fetch programs:", error);
        toast.error("Failed to load programs for selection.");
      } finally {
        setIsProgramsLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");
      formData.append("pathway_template_id", values.pathway_template_id || "");
      formData.append("program_id", values.program_id || ""); // Append program_id
      formData.append("start_date", values.start_date ? values.start_date.toISOString() : "");
      formData.append("end_date", values.end_date ? values.end_date.toISOString() : "");
      formData.append("is_public", values.is_public ? "on" : "off");
      formData.append("status", values.status);
      formData.append("config", JSON.stringify(values.config));

      let result: Campaign | null;
      if (initialData) {
        result = await updateCampaignAction(initialData.id, formData);
        if (result) {
          toast.success("Campaign updated successfully!");
          router.push(`/workbench/campaigns`); // Redirect to list after update
        }
      } else {
        result = await createCampaignAction(formData);
        if (result) {
          toast.success("Campaign created successfully!");
          router.push(`/workbench/campaigns`); // Redirect to list after creation
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save campaign.");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-headline-medium text-primary">
          {initialData ? "Edit Campaign" : "Create New Campaign"}
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          {initialData
            ? "Update the details of your campaign."
            : "Launch a new program by defining its core details and linking a pathway template."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Global Fellowship 2024" {...field} className="rounded-md" />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    A unique and descriptive name for your campaign.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a brief overview of this campaign."
                      className="resize-y min-h-[80px] rounded-md"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    Optional: A detailed description of the campaign.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="program_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Associated Program</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isProgramsLoading}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder={isProgramsLoading ? "Loading programs..." : "Select an associated program (optional)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      <SelectItem value="" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                        No Program (Standalone Campaign)
                      </SelectItem>
                      {programs.length === 0 && !isProgramsLoading ? (
                        <SelectItem value="no-programs" disabled className="text-body-medium text-muted-foreground">
                          No programs available. Create one first.
                        </SelectItem>
                      ) : (
                        programs.map((program) => (
                          <SelectItem key={program.id} value={program.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                            {program.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    Group this campaign under an existing program.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pathway_template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Pathway Template</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={isTemplatesLoading}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder={isTemplatesLoading ? "Loading templates..." : "Select a pathway template (optional)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {pathwayTemplates.length === 0 && !isTemplatesLoading ? (
                        <SelectItem value="no-templates" disabled className="text-body-medium text-muted-foreground">
                          No templates available. Create one first.
                        </SelectItem>
                      ) : (
                        pathwayTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                            {template.name} {template.is_private && "(Private)"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    Link this campaign to an existing pathway template to define its workflow.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-label-large">Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                      The date when the campaign officially begins.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-label-large">End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
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
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                      The date when the campaign officially ends.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-label-large">Make Public</FormLabel>
                    <FormDescription className="text-body-small">
                      If enabled, this campaign will be visible on the public portal.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Campaign Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select campaign status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      <SelectItem value="draft" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Draft</SelectItem>
                      <SelectItem value="active" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Active</SelectItem>
                      <SelectItem value="archived" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Archived</SelectItem>
                      <SelectItem value="completed" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    The current operational status of the campaign.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving..."
                : initialData
                ? "Update Campaign"
                : "Create Campaign"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}