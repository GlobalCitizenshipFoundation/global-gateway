"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { BaseConfigurableItem } from "../../services/pathway-template-service"; // Import BaseConfigurableItem
import { updatePhaseConfigAction as defaultUpdatePhaseConfigAction } from "../../actions"; // Renamed default action

// Zod schema for the Scheduling Phase configuration
const schedulingPhaseConfigSchema = z.object({
  interviewDuration: z.coerce.number().min(5, "Duration must be at least 5 minutes.").max(240, "Duration cannot exceed 240 minutes."),
  bufferTime: z.coerce.number().min(0, "Buffer time cannot be negative.").max(60, "Buffer time cannot exceed 60 minutes."),
  hostSelection: z.string().min(1, "At least one host must be selected."),
  automatedMeetingLink: z.string().url("Invalid URL format.").nullable().optional(), // New field for automated meeting link
});

interface SchedulingPhaseConfigProps {
  phase: BaseConfigurableItem; // Changed from Phase to BaseConfigurableItem
  parentId: string; // Renamed from pathwayTemplateId
  onConfigSaved: () => void;
  canModify: boolean;
  // Optional prop to override the default update action, now returns BaseConfigurableItem | null
  updatePhaseConfigAction?: (phaseId: string, parentId: string, configUpdates: Record<string, any>) => Promise<BaseConfigurableItem | null>;
}

export function SchedulingPhaseConfig({ phase, parentId, onConfigSaved, canModify, updatePhaseConfigAction }: SchedulingPhaseConfigProps) {
  const form = useForm<z.infer<typeof schedulingPhaseConfigSchema>>({
    resolver: zodResolver(schedulingPhaseConfigSchema),
    defaultValues: {
      interviewDuration: phase.config?.interviewDuration || 30,
      bufferTime: phase.config?.bufferTime || 15,
      hostSelection: phase.config?.hostSelection || "",
      automatedMeetingLink: phase.config?.automatedMeetingLink || null, // Default to null
    },
    mode: "onChange",
  });

  const onSubmit = async (values: z.infer<typeof schedulingPhaseConfigSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this phase configuration.");
      return;
    }
    try {
      const updatedConfig = { ...phase.config, ...values };
      const action = updatePhaseConfigAction || defaultUpdatePhaseConfigAction;
      const result = await action(phase.id, parentId, updatedConfig); // Use parentId here
      if (result) {
        toast.success("Scheduling phase configuration updated successfully!");
        onConfigSaved();
      }
    } catch (error: any) {
      console.error("Scheduling phase config submission error:", error);
      toast.error(error.message || "Failed to save scheduling phase configuration.");
    }
  };

  // Placeholder for host selection. In a real app, this would fetch actual users.
  const hostOptions = [
    { value: "host_pool_1", label: "General Host Pool" },
    { value: "recruiter_team", label: "Recruitment Team" },
    { value: "evaluator_group_a", label: "Evaluator Group A" },
  ];

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-headline-small text-foreground">Scheduling Settings</CardTitle>
        <p className="text-body-medium text-muted-foreground">Configure interview durations, buffer times, and host assignments for this scheduling phase.</p>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="interviewDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Interview Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} placeholder="e.g., 30" className="rounded-md" disabled={!canModify} />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    The standard length of each interview slot.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bufferTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Buffer Time (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} placeholder="e.g., 15" className="rounded-md" disabled={!canModify} />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    Time added between interviews for breaks or preparation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hostSelection"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Host Selection</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canModify}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select interview hosts" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {hostOptions.map((host) => (
                        <SelectItem key={host.value} value={host.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                          {host.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    Choose the pool of internal users who can host interviews for this phase.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="automatedMeetingLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Automated Meeting Link (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., https://zoom.us/j/your-meeting-id" className="rounded-md" disabled={!canModify} value={field.value || ""} />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    Provide a base URL for automated meeting links. If left empty, a generic link will be generated.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canModify && (
              <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Scheduling Configuration"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}