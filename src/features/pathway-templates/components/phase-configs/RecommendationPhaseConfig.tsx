"use client";

import React from "react";
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
import { PlusCircle, Trash2, GripVertical } from "lucide-react";
import { BaseConfigurableItem, Phase } from "../../services/pathway-template-service"; // Import BaseConfigurableItem
import { updatePhaseConfigAction as defaultUpdatePhaseConfigAction } from "../../actions"; // Renamed default action

// Zod schema for a single recommender information field
const recommenderFieldSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Field label is required."),
  type: z.enum(["Text", "Email", "Phone", "Organization", "Relationship"]),
  required: z.boolean(),
});

// Zod schema for the Recommendation Phase configuration
const recommendationPhaseConfigSchema = z.object({
  numRecommendersRequired: z.coerce.number().min(1, "At least 1 recommender is required.").max(5, "Cannot require more than 5 recommenders."),
  recommenderInformationFields: z.array(recommenderFieldSchema),
  reminderSchedule: z.string().min(1, "Reminder schedule is required."),
});

interface RecommendationPhaseConfigProps {
  phase: BaseConfigurableItem; // Changed from Phase to BaseConfigurableItem
  parentId: string; // Renamed from pathwayTemplateId
  onConfigSaved: () => void;
  canModify: boolean;
  // Optional prop to override the default update action, now returns BaseConfigurableItem | null
  updatePhaseConfigAction?: (phaseId: string, parentId: string, configUpdates: Record<string, any>) => Promise<BaseConfigurableItem | null>;
}

export function RecommendationPhaseConfig({ phase, parentId, onConfigSaved, canModify, updatePhaseConfigAction }: RecommendationPhaseConfigProps) {
  const form = useForm<z.infer<typeof recommendationPhaseConfigSchema>>({
    resolver: zodResolver(recommendationPhaseConfigSchema),
    defaultValues: {
      numRecommendersRequired: phase.config?.numRecommendersRequired || 1,
      recommenderInformationFields: (phase.config?.recommenderInformationFields as z.infer<typeof recommenderFieldSchema>[]) || [],
      reminderSchedule: phase.config?.reminderSchedule || "weekly",
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "recommenderInformationFields",
    keyName: "arrayId",
  });

  const onSubmit = async (values: z.infer<typeof recommendationPhaseConfigSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this phase configuration.");
      return;
    }
    try {
      const updatedConfig = { ...phase.config, ...values };
      const action = updatePhaseConfigAction || defaultUpdatePhaseConfigAction;
      const result = await action(phase.id, parentId, updatedConfig); // Use parentId here
      if (result) {
        toast.success("Recommendation phase configuration updated successfully!");
        onConfigSaved();
      }
    } catch (error: any) {
      console.error("Recommendation phase config submission error:", error);
      toast.error(error.message || "Failed to save recommendation phase configuration.");
    }
  };

  const recommenderFieldTypes = [
    { value: "Text", label: "Text Input" },
    { value: "Email", label: "Email Address" },
    { value: "Phone", label: "Phone Number" },
    { value: "Organization", label: "Organization Name" },
    { value: "Relationship", label: "Relationship to Applicant" },
  ];

  const reminderScheduleOptions = [
    { value: "none", label: "No Reminders" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "bi-weekly", label: "Bi-Weekly" },
  ];

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-headline-small text-foreground">Recommendation Settings</CardTitle>
        <p className="text-body-medium text-muted-foreground">Configure the requirements and process for recommendations in this phase.</p>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="numRecommendersRequired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Number of Recommenders Required</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} placeholder="e.g., 1" className="rounded-md" disabled={!canModify} />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    The minimum number of recommendations an applicant must receive.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-title-large font-bold text-foreground mt-8">Recommender Information Fields</h3>
            <p className="text-body-medium text-muted-foreground">Define the information applicants must provide about their recommenders.</p>

            {fields.length === 0 && (
              <p className="text-body-medium text-muted-foreground text-center">No recommender fields added yet. Click "Add Field" to start.</p>
            )}
            {fields.map((fieldItem, index) => (
              <Card key={fieldItem.arrayId} className="rounded-lg border p-4 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <h4 className="text-title-medium text-foreground">Field #{index + 1}</h4>
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
                      <span className="sr-only">Remove Field</span>
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`recommenderInformationFields.${index}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Field Label</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Recommender's Email" className="rounded-md" disabled={!canModify} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`recommenderInformationFields.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Field Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canModify}>
                        <FormControl>
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                          {recommenderFieldTypes.map((type) => (
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

                <FormField
                  control={form.control}
                  name={`recommenderInformationFields.${index}.required`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-label-large">Required Field</FormLabel>
                        <FormDescription className="text-body-small">
                          Is this information mandatory for the recommender?
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
                onClick={() => append({ id: crypto.randomUUID(), label: "", type: "Text", required: true })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Field
              </Button>
            )}

            <FormField
              control={form.control}
              name="reminderSchedule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Reminder Schedule</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canModify}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select reminder frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {reminderScheduleOptions.map((schedule) => (
                        <SelectItem key={schedule.value} value={schedule.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                          {schedule.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    How often should reminders be sent to recommenders who haven't submitted?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canModify && (
              <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Recommendation Configuration"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}