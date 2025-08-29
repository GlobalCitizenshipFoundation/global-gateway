"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { PlusCircle, Trash2, GripVertical } from "lucide-react";
import { Phase } from "../../services/pathway-template-service";
import { updatePhaseConfigAction } from "../../actions";

// Zod schema for a single decision outcome
const decisionOutcomeSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Outcome label is required."),
  isFinal: z.boolean(),
});

// Zod schema for the Decision Phase configuration
const decisionPhaseConfigSchema = z.object({
  decisionOutcomes: z.array(decisionOutcomeSchema).min(1, "At least one decision outcome is required."),
  associatedEmailTemplate: z.string().nullable().optional(),
  automatedNextStep: z.string().nullable().optional(),
});

interface DecisionPhaseConfigProps {
  phase: Phase;
  pathwayTemplateId: string;
  onConfigSaved: () => void;
  canModify: boolean;
}

export function DecisionPhaseConfig({ phase, pathwayTemplateId, onConfigSaved, canModify }: DecisionPhaseConfigProps) {
  const form = useForm<z.infer<typeof decisionPhaseConfigSchema>>({
    resolver: zodResolver(decisionPhaseConfigSchema),
    defaultValues: {
      decisionOutcomes: (phase.config?.decisionOutcomes as z.infer<typeof decisionOutcomeSchema>[]) || [],
      associatedEmailTemplate: phase.config?.associatedEmailTemplate || "",
      automatedNextStep: phase.config?.automatedNextStep || "",
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "decisionOutcomes",
    keyName: "arrayId",
  });

  const onSubmit = async (values: z.infer<typeof decisionPhaseConfigSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this phase configuration.");
      return;
    }
    try {
      const updatedConfig = { ...phase.config, ...values };
      const result = await updatePhaseConfigAction(phase.id, pathwayTemplateId, updatedConfig);
      if (result) {
        toast.success("Decision phase configuration updated successfully!");
        onConfigSaved();
      }
    } catch (error: any) {
      console.error("Decision phase config submission error:", error);
      toast.error(error.message || "Failed to save decision phase configuration.");
    }
  };

  // Placeholder for email templates and next steps.
  const emailTemplateOptions = [
    { value: "acceptance_email", label: "Acceptance Email" },
    { value: "rejection_email", label: "Rejection Email" },
    { value: "waitlist_email", label: "Waitlist Email" },
  ];

  const nextStepOptions = [
    { value: "move_to_onboarding", label: "Move to Onboarding" },
    { value: "archive_application", label: "Archive Application" },
    { value: "send_follow_up", label: "Send Follow-up Email" },
  ];

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-headline-small text-foreground">Decision Settings</CardTitle>
        <p className="text-body-medium text-muted-foreground">Define possible outcomes and automated actions for this decision phase.</p>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <h3 className="text-title-large font-bold text-foreground mt-8">Decision Outcomes</h3>
            <p className="text-body-medium text-muted-foreground">Define the possible results for applications in this phase (e.g., Accepted, Rejected).</p>

            {fields.length === 0 && (
              <p className="text-body-medium text-muted-foreground text-center">No decision outcomes added yet. Click "Add Outcome" to start.</p>
            )}
            {fields.map((outcome, index) => (
              <Card key={outcome.arrayId} className="rounded-lg border p-4 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <h4 className="text-title-medium text-foreground">Outcome #{index + 1}</h4>
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
                      <span className="sr-only">Remove Outcome</span>
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`decisionOutcomes.${index}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Outcome Label</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Accepted" className="rounded-md" disabled={!canModify} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`decisionOutcomes.${index}.isFinal`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-label-large">Is Final Decision?</FormLabel>
                        <FormDescription className="text-body-small">
                          Marks this outcome as a final decision for the application.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Input type="checkbox" checked={field.value} onChange={field.onChange} disabled={!canModify} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            ))}

            {canModify && (
              <Button
                type="button"
                variant="outlined"
                onClick={() => append({ id: crypto.randomUUID(), label: "", isFinal: false })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Outcome
              </Button>
            )}

            <FormField
              control={form.control}
              name="associatedEmailTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Associated Email Template</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""} disabled={!canModify}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select an email template (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {emailTemplateOptions.map((template) => (
                        <SelectItem key={template.value} value={template.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    An email template to be automatically sent when a decision is made.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="automatedNextStep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Automated Next Step</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""} disabled={!canModify}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select an automated action (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {nextStepOptions.map((step) => (
                        <SelectItem key={step.value} value={step.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                          {step.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    An action to automatically trigger after a decision is made.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canModify && (
              <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Decision Configuration"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}