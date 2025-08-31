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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { PlusCircle, Trash2, GripVertical, Save, X } from "lucide-react"; // Added Save and X icons
import { BaseConfigurableItem } from "@/types/supabase"; // Corrected import path
import { updatePhaseConfigAction as defaultUpdatePhaseConfigAction } from "../../actions";
import { cn } from "@/lib/utils";

// Zod schema for a single rubric criterion
const rubricCriterionSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new criteria
  name: z.string().min(1, "Criterion name is required."),
  description: z.string().nullable().optional(),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1.").max(100, "Max score cannot exceed 100."), // Added max constraint
  weight: z.coerce.number().min(0, "Weight cannot be negative.").max(100, "Weight cannot exceed 100.").optional(), // Added weight
});

// Zod schema for the entire Review Phase configuration
const reviewPhaseConfigSchema = z.object({
  rubricCriteria: z.array(rubricCriterionSchema),
  scoringScale: z.enum(["1-5", "1-10", "Custom"]),
  anonymizationSettings: z.enum(["None", "Blind", "Double-Blind"]),
  allowComments: z.boolean(),
});

interface ReviewPhaseConfigProps {
  phase: BaseConfigurableItem;
  parentId: string;
  onConfigSaved: () => void;
  onCancel: () => void; // Added onCancel prop
  canModify: boolean;
  updatePhaseConfigAction?: (phaseId: string, parentId: string, configUpdates: Record<string, any>) => Promise<BaseConfigurableItem | null>;
}

export function ReviewPhaseConfig({ phase, parentId, onConfigSaved, onCancel, canModify, updatePhaseConfigAction }: ReviewPhaseConfigProps) {
  const form = useForm<z.infer<typeof reviewPhaseConfigSchema>>({
    resolver: zodResolver(reviewPhaseConfigSchema),
    defaultValues: {
      rubricCriteria: (phase.config?.rubricCriteria as z.infer<typeof rubricCriterionSchema>[])?.map(criterion => ({
        ...criterion,
        weight: criterion.weight ?? 1, // Default weight to 1 if not present
      })) || [],
      scoringScale: phase.config?.scoringScale || "1-5",
      anonymizationSettings: phase.config?.anonymizationSettings || "None",
      allowComments: phase.config?.allowComments ?? true,
    },
    mode: "onChange",
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "rubricCriteria",
    keyName: "arrayId",
  });

  const onSubmit = async (values: z.infer<typeof reviewPhaseConfigSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this phase configuration.");
      return;
    }
    try {
      const updatedConfig = { ...phase.config, ...values };
      const action = updatePhaseConfigAction || defaultUpdatePhaseConfigAction;
      const result = await action(phase.id, parentId, updatedConfig);
      if (result) {
        toast.success("Review phase configuration updated successfully!");
        onConfigSaved();
      }
    } catch (error: any) {
      console.error("Review phase config submission error:", error);
      toast.error(error.message || "Failed to save review phase configuration.");
    }
  };

  const scoringScales = [
    { value: "1-5", label: "1 to 5" },
    { value: "1-10", label: "1 to 10" },
    { value: "Custom", label: "Custom (defined by rubric)" },
  ];

  const anonymizationOptions = [
    { value: "None", label: "None (Reviewers see all applicant info)" },
    { value: "Blind", label: "Blind (Reviewers don't see applicant identity)" },
    { value: "Double-Blind", label: "Double-Blind (Reviewers and applicants are anonymous)" },
  ];

  return (
    <div className="rounded-xl shadow-lg p-6">
      <div className="p-0 mb-6">
        <h3 className="text-headline-small text-foreground">Review Settings</h3>
        <p className="text-body-medium text-muted-foreground">Configure how applications will be reviewed in this phase.</p>
      </div>
      <div className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="scoringScale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Scoring Scale</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canModify}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select a scoring scale" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {scoringScales.map((scale) => (
                        <SelectItem key={scale.value} value={scale.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                          {scale.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    Choose the numerical scale for reviewer scores.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="anonymizationSettings"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-label-large">Anonymization Settings</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                      disabled={!canModify}
                    >
                      {anonymizationOptions.map((option) => (
                        <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={option.value} />
                          </FormControl>
                          <FormLabel className="font-normal text-body-medium cursor-pointer">
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormDescription className="text-body-small">
                    Control what information reviewers see about applicants.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowComments"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-label-large">Allow Comments</FormLabel>
                    <FormDescription className="text-body-small">
                      Allow reviewers to provide qualitative feedback and comments.
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
                </FormItem>
              )}
            />

            <h3 className="text-title-large font-bold text-foreground mt-8">Rubric Criteria</h3>
            <p className="text-body-medium text-muted-foreground">Define the criteria reviewers will use to score applications.</p>

            {fields.length === 0 && (
              <p className="text-body-medium text-muted-foreground text-center">No rubric criteria added yet. Click "Add Criterion" to start.</p>
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
                  name={`rubricCriteria.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Criterion Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Leadership Potential" className="rounded-md" disabled={!canModify} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`rubricCriteria.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Optional description for this criterion."
                          className="resize-y min-h-[80px] rounded-md"
                          value={field.value || ""}
                          disabled={!canModify}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`rubricCriteria.${index}.maxScore`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-label-large">Maximum Score</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} placeholder="e.g., 5" className="rounded-md" disabled={!canModify} />
                        </FormControl>
                        <FormDescription className="text-body-small">
                          The highest score a reviewer can give for this criterion.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`rubricCriteria.${index}.weight`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-label-large">Weight (%)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} placeholder="e.g., 25" className="rounded-md" disabled={!canModify} />
                        </FormControl>
                        <FormDescription className="text-body-small">
                          Relative importance of this criterion (0-100).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            ))}

            {canModify && (
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ id: crypto.randomUUID(), name: "", description: "", maxScore: 5, weight: 1 })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Criterion
              </Button>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel} className="rounded-md text-label-large">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              {canModify && (
                <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Review Configuration</>}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}