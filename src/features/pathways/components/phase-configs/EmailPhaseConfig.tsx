"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BaseConfigurableItem } from "@/types/supabase"; // Corrected import path
import { updatePhaseConfigAction as defaultUpdatePhaseConfigAction } from "../../actions";
import { getCommunicationTemplatesAction, CommunicationTemplate } from "@/features/communications";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Trash2, GitFork, Save, X } from "lucide-react"; // Added Save and X icons

// Zod schema for a single dynamic content block
const dynamicContentBlockSchema = z.object({
  id: z.string().uuid().optional(),
  condition: z.string().min(1, "Condition is required for dynamic block."),
  content: z.string().min(1, "Content is required for dynamic block."),
});

// Zod schema for the Email Phase configuration
const emailPhaseConfigSchema = z.object({
  subject: z.string().min(1, "Email subject is required.").max(200, "Subject cannot exceed 200 characters."),
  body: z.string().min(1, "Email body is required."),
  recipientRoles: z.array(z.string()).min(1, "At least one recipient role is required."),
  triggerEvent: z.string().min(1, "A trigger event is required."),
  selectedTemplateId: z.string().uuid("Invalid template ID.").nullable().optional(),
  dynamicContentBlocks: z.array(dynamicContentBlockSchema).optional(), // New field for dynamic content
});

interface EmailPhaseConfigProps {
  phase: BaseConfigurableItem;
  parentId: string;
  onConfigSaved: () => void;
  onCancel: () => void; // Added onCancel prop
  canModify: boolean;
  updatePhaseConfigAction?: (phaseId: string, parentId: string, configUpdates: Record<string, any>) => Promise<BaseConfigurableItem | null>;
}

export function EmailPhaseConfig({ phase, parentId, onConfigSaved, onCancel, canModify, updatePhaseConfigAction }: EmailPhaseConfigProps) {
  const [communicationTemplates, setCommunicationTemplates] = useState<CommunicationTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const form = useForm<z.infer<typeof emailPhaseConfigSchema>>({
    resolver: zodResolver(emailPhaseConfigSchema),
    defaultValues: {
      subject: phase.config?.subject || "",
      body: phase.config?.body || "",
      recipientRoles: phase.config?.recipientRoles || [],
      triggerEvent: phase.config?.triggerEvent || "",
      selectedTemplateId: phase.config?.selectedTemplateId || null,
      dynamicContentBlocks: (phase.config?.dynamicContentBlocks as z.infer<typeof dynamicContentBlockSchema>[]) || [],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "dynamicContentBlocks",
    keyName: "arrayId",
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const templates = await getCommunicationTemplatesAction();
        if (templates) {
          setCommunicationTemplates(templates);
        }
      } catch (error) {
        console.error("Failed to fetch communication templates:", error);
        toast.error("Failed to load communication templates for selection.");
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  // Effect to update subject/body when a template is selected
  useEffect(() => {
    const selectedTemplateId = form.watch("selectedTemplateId");
    if (selectedTemplateId) {
      const selectedTemplate = communicationTemplates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        form.setValue("subject", selectedTemplate.subject);
        form.setValue("body", selectedTemplate.body);
      }
    }
  }, [form.watch("selectedTemplateId"), communicationTemplates]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: z.infer<typeof emailPhaseConfigSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this phase configuration.");
      return;
    }
    try {
      const updatedConfig = { ...phase.config, ...values };
      const action = updatePhaseConfigAction || defaultUpdatePhaseConfigAction;
      const result = await action(phase.id, parentId, updatedConfig);
      if (result) {
        toast.success("Email phase configuration updated successfully!");
        onConfigSaved();
      }
    } catch (error: any) {
      console.error("Email phase config submission error:", error);
      toast.error(error.message || "Failed to save email phase configuration.");
    }
  };

  const recipientRoleOptions = [
    { value: "applicant", label: "Applicant" },
    { value: "reviewer", label: "Reviewer" },
    { value: "coordinator", label: "Coordinator" },
    { value: "admin", label: "Administrator" },
  ];

  const triggerEventOptions = [
    { value: "phase_start", label: "Phase Starts" },
    { value: "application_submitted", label: "Application Submitted" },
    { value: "phase_complete", label: "Phase Completed" },
    { value: "decision_made", label: "Decision Made" },
    { value: "task_completed", label: "Task Completed" }, // New trigger
    { value: "custom_event", label: "Custom Event" },
  ];

  return (
    <div className="rounded-xl shadow-lg p-6">
      <div className="p-0 mb-6">
        <h3 className="text-headline-small text-foreground">Email Settings</h3>
        <p className="text-body-medium text-muted-foreground">Define the content and triggers for this email phase.</p>
      </div>
      <div className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="selectedTemplateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Use Template</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={!canModify || isLoadingTemplates}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Select an existing template (optional)"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      <SelectItem value="" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                        None (Write custom email)
                      </SelectItem>
                      {communicationTemplates.length === 0 && !isLoadingTemplates ? (
                        <SelectItem value="no-templates" disabled className="text-body-medium text-muted-foreground">
                          No templates available. Create one first.
                        </SelectItem>
                      ) : (
                        communicationTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                            {template.name} ({template.type}) {template.is_public ? "" : "(Private)"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    Select a pre-defined communication template to pre-fill the subject and body.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Email Subject</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Your Application Status Update" className="rounded-md" disabled={!canModify} />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    The subject line of the email. Dynamic placeholders (e.g., {"{{applicant_name}}"}) can be used.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Email Body</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Dear {{applicant_name}}, your application has moved to the next phase."
                      className="resize-y min-h-[150px] rounded-md"
                      disabled={!canModify}
                    />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    The main content of the email. Supports rich text and dynamic placeholders.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-title-large font-bold text-foreground mt-8">Dynamic Content Blocks</h3>
            <p className="text-body-medium text-muted-foreground">Add conditional content that appears based on specific criteria.</p>

            {fields.length === 0 && (
              <p className="text-body-medium text-muted-foreground text-center">No dynamic content blocks added yet.</p>
            )}
            {fields.map((block, index) => (
              <Card key={block.arrayId} className="rounded-lg border p-4 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitFork className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-title-medium text-foreground">Conditional Block #{index + 1}</h4>
                  </div>
                  {canModify && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="rounded-md"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove Block</span>
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`dynamicContentBlocks.${index}.condition`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Condition</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., application.status === 'accepted'" className="rounded-md" disabled={!canModify} />
                      </FormControl>
                      <FormDescription className="text-body-small">
                        Define a condition (e.g., `application.status === 'accepted'`) for this content to appear.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`dynamicContentBlocks.${index}.content`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Content</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="e.g., Congratulations! You have been accepted into the program."
                          className="resize-y min-h-[100px] rounded-md"
                          disabled={!canModify}
                        />
                      </FormControl>
                      <FormDescription className="text-body-small">
                        The content to display if the condition is met. Supports dynamic placeholders.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            ))}

            {canModify && (
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ id: crypto.randomUUID(), condition: "", content: "" })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Dynamic Content Block
              </Button>
            )}

            <FormField
              control={form.control}
              name="recipientRoles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Recipient Role(s)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // For simplicity, treating as single select for now.
                      // For multi-select, a custom component or different approach would be needed.
                      field.onChange([value]);
                    }}
                    value={field.value?.[0] || ""} // Display current single selection
                    disabled={!canModify}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select recipient role(s)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {recipientRoleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    Choose which role(s) will receive this email. (Currently supports single selection)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="triggerEvent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Trigger Event</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canModify}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select when to send this email" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {triggerEventOptions.map((event) => (
                        <SelectItem key={event.value} value={event.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    When should this email be automatically sent?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel} className="rounded-md text-label-large">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              {canModify && (
                <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Email Configuration</>}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}