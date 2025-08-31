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
import { PlusCircle, Trash2, GripVertical, GitFork, Save, X } from "lucide-react"; // Added Save and X icons
import { BaseConfigurableItem } from "@/types/supabase"; // Corrected import path
import { updatePhaseConfigAction as defaultUpdatePhaseConfigAction } from "../../actions";
import { Checkbox } from "@/components/ui/checkbox";

// Zod schema for a single decision outcome
const decisionOutcomeSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Outcome label is required."),
  isFinal: z.boolean(),
});

// Zod schema for a single decision rule
const decisionRuleSchema = z.object({
  id: z.string().uuid().optional(),
  condition: z.string().min(1, "Condition is required."),
  outcome: z.string().min(1, "Outcome is required."),
  priority: z.coerce.number().min(1, "Priority must be at least 1.").optional(),
});

// Zod schema for the Decision Phase configuration
const decisionPhaseConfigSchema = z.object({
  decisionOutcomes: z.array(decisionOutcomeSchema).min(1, "At least one decision outcome is required."),
  decisionRules: z.array(decisionRuleSchema).optional(), // New field for decision rules
  associatedEmailTemplate: z.string().nullable().optional(),
  automatedNextStep: z.string().nullable().optional(),
});

interface DecisionPhaseConfigProps {
  phase: BaseConfigurableItem;
  parentId: string;
  onConfigSaved: () => void;
  onCancel: () => void; // Added onCancel prop
  canModify: boolean;
  updatePhaseConfigAction?: (phaseId: string, parentId: string, configUpdates: Record<string, any>) => Promise<BaseConfigurableItem | null>;
}

export function DecisionPhaseConfig({ phase, parentId, onConfigSaved, onCancel, canModify, updatePhaseConfigAction }: DecisionPhaseConfigProps) {
  const form = useForm<z.infer<typeof decisionPhaseConfigSchema>>({
    resolver: zodResolver(decisionPhaseConfigSchema),
    defaultValues: {
      decisionOutcomes: (phase.config?.decisionOutcomes as z.infer<typeof decisionOutcomeSchema>[]) || [],
      decisionRules: (phase.config?.decisionRules as z.infer<typeof decisionRuleSchema>[]) || [], // Default for new field
      associatedEmailTemplate: phase.config?.associatedEmailTemplate || "",
      automatedNextStep: phase.config?.automatedNextStep || "",
    },
    mode: "onChange",
  });

  const { fields: outcomeFields, append: appendOutcome, remove: removeOutcome } = useFieldArray({
    control: form.control,
    name: "decisionOutcomes",
    keyName: "arrayId",
  });

  const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({
    control: form.control,
    name: "decisionRules",
    keyName: "arrayId",
  });

  const onSubmit = async (values: z.infer<typeof decisionPhaseConfigSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this phase configuration.");
      return;
    }
    try {
      const updatedConfig = { ...phase.config, ...values };
      const action = updatePhaseConfigAction || defaultUpdatePhaseConfigAction;
      const result = await action(phase.id, parentId, updatedConfig); // Use parentId here
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
    { value: "initiate_sub_workflow", label: "Initiate Sub-Workflow" }, // New advanced action
    { value: "update_crm", label: "Update External CRM" }, // New advanced action
  ];

  return (
    <div className="rounded-xl shadow-lg p-6">
      <div className="p-0 mb-6">
        <h3 className="text-headline-small text-foreground">Decision Settings</h3>
        <p className="text-body-medium text-muted-foreground">Define possible outcomes and automated actions for this decision phase.</p>
      </div>
      <div className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <h3 className="text-title-large font-bold text-foreground mt-8">Decision Outcomes</h3>
            <p className="text-body-medium text-muted-foreground">Define the possible results for applications in this phase (e.g., Accepted, Rejected).</p>

            {outcomeFields.length === 0 && (
              <p className="text-body-medium text-muted-foreground text-center">No decision outcomes added yet. Click "Add Outcome" to start.</p>
            )}
            {outcomeFields.map((outcome, index) => (
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
                      onClick={() => removeOutcome(index)}
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
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canModify}
                        />
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
                variant="outline"
                onClick={() => appendOutcome({ id: crypto.randomUUID(), label: "", isFinal: false })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Outcome
              </Button>
            )}

            <h3 className="text-title-large font-bold text-foreground mt-8">Decision Rules</h3>
            <p className="text-body-medium text-muted-foreground">Define rules to automatically set an outcome based on application data.</p>

            {ruleFields.length === 0 && (
              <p className="text-body-medium text-muted-foreground text-center">No decision rules added yet. Click "Add Rule" to start.</p>
            )}
            {ruleFields.map((rule, index) => (
              <Card key={rule.arrayId} className="rounded-lg border p-4 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitFork className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-title-medium text-foreground">Rule #{index + 1}</h4>
                  </div>
                  {canModify && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="rounded-md"
                      onClick={() => removeRule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove Rule</span>
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`decisionRules.${index}.condition`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Condition</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., average_review_score > 4" className="rounded-md" disabled={!canModify} />
                      </FormControl>
                      <FormDescription className="text-body-small">
                        Define a condition (e.g., `application.data.gpa &gt; 3.5` or `average_review_score &gt; 4`).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`decisionRules.${index}.outcome`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Outcome</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!canModify}>
                        <FormControl>
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select an outcome" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                          {outcomeFields.length === 0 ? (
                            <SelectItem value="no-outcomes" disabled className="text-body-medium text-muted-foreground">
                              No outcomes defined.
                            </SelectItem>
                          ) : (
                            outcomeFields.map((outcome) => (
                              <SelectItem key={outcome.id} value={outcome.label} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                {outcome.label}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-body-small">
                        The outcome to apply if this condition is met.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`decisionRules.${index}.priority`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Priority (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} placeholder="e.g., 1" className="rounded-md" disabled={!canModify} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription className="text-body-small">
                        Rules with higher priority will be evaluated first.
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
                onClick={() => appendRule({ id: crypto.randomUUID(), condition: "", outcome: "", priority: 1 })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Rule
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel} className="rounded-md text-label-large">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              {canModify && (
                <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Decision Configuration</>}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}