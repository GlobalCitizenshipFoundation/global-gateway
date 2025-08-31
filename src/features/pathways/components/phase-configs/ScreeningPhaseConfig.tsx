"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { PlusCircle, Trash2, GripVertical, ListChecks, Save, X } from "lucide-react"; // Added Save and X icons
import { BaseConfigurableItem } from "../../services/pathway-template-service";
import { updatePhaseConfigAction as defaultUpdatePhaseConfigAction } from "../../actions";
import { cn } from "@/lib/utils";

// Zod schema for a single screening criterion
const screeningCriterionSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new criteria
  criterion: z.string().min(1, "Screening criterion is required."),
  description: z.string().nullable().optional(),
  required: z.boolean(),
});

// Zod schema for the entire Screening Phase configuration
const screeningPhaseConfigSchema = z.object({
  screeningCriteria: z.array(screeningCriterionSchema),
  autoAdvanceOnAllCriteriaMet: z.boolean(),
  internalNotesPrompt: z.string().max(500, "Prompt cannot exceed 500 characters.").nullable().optional(),
});

interface ScreeningPhaseConfigProps {
  phase: BaseConfigurableItem;
  parentId: string;
  onConfigSaved: () => void;
  onCancel: () => void; // Added onCancel prop
  canModify: boolean;
  updatePhaseConfigAction?: (phaseId: string, parentId: string, configUpdates: Record<string, any>) => Promise<BaseConfigurableItem | null>;
}

export function ScreeningPhaseConfig({ phase, parentId, onConfigSaved, onCancel, canModify, updatePhaseConfigAction }: ScreeningPhaseConfigProps) {
  const form = useForm<z.infer<typeof screeningPhaseConfigSchema>>({
    resolver: zodResolver(screeningPhaseConfigSchema),
    defaultValues: {
      screeningCriteria: (phase.config?.screeningCriteria as z.infer<typeof screeningCriterionSchema>[])?.map(criterion => ({
        ...criterion,
        required: criterion.required ?? false,
      })) || [],
      autoAdvanceOnAllCriteriaMet: phase.config?.autoAdvanceOnAllCriteriaMet ?? false,
      internalNotesPrompt: phase.config?.internalNotesPrompt || "",
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "screeningCriteria",
    keyName: "arrayId",
  });

  const onSubmit = async (values: z.infer<typeof screeningPhaseConfigSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this phase configuration.");
      return;
    }
    try {
      const updatedConfig = { ...phase.config, ...values };
      const action = updatePhaseConfigAction || defaultUpdatePhaseConfigAction;
      const result = await action(phase.id, parentId, updatedConfig);
      if (result) {
        toast.success("Screening phase configuration updated successfully!");
        onConfigSaved();
      }
    } catch (error: any) {
      console.error("Screening phase config submission error:", error);
      toast.error(error.message || "Failed to save screening phase configuration.");
    }
  };

  return (
    <div className="rounded-xl shadow-lg p-6">
      <div className="p-0 mb-6">
        <h3 className="text-headline-small text-foreground">Screening Settings</h3>
        <p className="text-body-medium text-muted-foreground">Define the criteria and automation for this screening phase.</p>
      </div>
      <div className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="autoAdvanceOnAllCriteriaMet"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-label-large">Auto-Advance on All Criteria Met</FormLabel>
                    <FormDescription className="text-body-small">
                      If enabled, applications will automatically advance to the next phase once all required screening criteria are met.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
                      disabled={!canModify}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="internalNotesPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Internal Notes Prompt (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Summarize key findings from the initial screening."
                      className="resize-y min-h-[80px] rounded-md"
                      value={field.value || ""}
                      disabled={!canModify}
                    />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    A prompt to guide screeners when adding internal notes for this phase.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-title-large font-bold text-foreground mt-8">Screening Criteria</h3>
            <p className="text-body-medium text-muted-foreground">Define the checklist items screeners will use to evaluate applications.</p>

            {fields.length === 0 && (
              <p className="text-body-medium text-muted-foreground text-center">No screening criteria added yet. Click "Add Criterion" to start.</p>
            )}
            {fields.map((criterion, index) => (
              <Card key={criterion.arrayId} className="rounded-lg border p-4 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <h4 className="text-title-medium text-foreground">Criterion #{index + 1}</h4>
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
                      <span className="sr-only">Remove Criterion</span>
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`screeningCriteria.${index}.criterion`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Criterion Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Verified minimum GPA" className="rounded-md" disabled={!canModify} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`screeningCriteria.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Provide a brief explanation or instructions for this criterion."
                          className="resize-y min-h-[80px] rounded-md"
                          value={field.value || ""}
                          disabled={!canModify}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`screeningCriteria.${index}.required`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-label-large">Required Criterion</FormLabel>
                        <FormDescription className="text-body-small">
                          Must this criterion be met for the application to pass screening?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
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
                variant="outlined"
                onClick={() => append({ id: crypto.randomUUID(), criterion: "", description: "", required: true })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Criterion
              </Button>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outlined" onClick={onCancel} className="rounded-md text-label-large">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              {canModify && (
                <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Screening Configuration</>}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}