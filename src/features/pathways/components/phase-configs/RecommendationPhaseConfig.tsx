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
import { PlusCircle, Trash2, GripVertical, Mail, Clock, Save, X } from "lucide-react"; // Added Save and X icons
import { BaseConfigurableItem } from "../../services/pathway-template-service";
import { updatePhaseConfigAction as defaultUpdatePhaseConfigAction } from "../../actions";

// Zod schema for a single recommender information field
const recommenderFieldSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Field label is required."),
  type: z.enum(["Text", "Email", "Phone", "Organization", "Relationship", "Rich Text Area", "Date", "Checkbox", "Radio Group"]), // Expanded types
  required: z.boolean(),
  helperText: z.string().nullable().optional(), // Added helperText
  options: z.array(z.string().min(1, "Option cannot be empty.")).optional(), // For Select, Radio, Checkbox
});

// Zod schema for the Recommendation Phase configuration
const recommendationPhaseConfigSchema = z.object({
  numRecommendersRequired: z.coerce.number().min(1, "At least 1 recommender is required.").max(5, "Cannot require more than 5 recommenders."),
  recommenderInformationFields: z.array(recommenderFieldSchema),
  reminderSchedule: z.string().min(1, "Reminder schedule is required."),
  automatedRequestSending: z.boolean(), // New field for automated request sending
  requestEmailTemplateId: z.string().uuid("Invalid email template ID.").nullable().optional(), // New field for email template
});

interface RecommendationPhaseConfigProps {
  phase: BaseConfigurableItem;
  parentId: string;
  onConfigSaved: () => void;
  onCancel: () => void; // Added onCancel prop
  canModify: boolean;
  updatePhaseConfigAction?: (phaseId: string, parentId: string, configUpdates: Record<string, any>) => Promise<BaseConfigurableItem | null>;
}

export function RecommendationPhaseConfig({ phase, parentId, onConfigSaved, onCancel, canModify, updatePhaseConfigAction }: RecommendationPhaseConfigProps) {
  const form = useForm<z.infer<typeof recommendationPhaseConfigSchema>>({
    resolver: zodResolver(recommendationPhaseConfigSchema),
    defaultValues: {
      numRecommendersRequired: phase.config?.numRecommendersRequired || 1,
      recommenderInformationFields: (phase.config?.recommenderInformationFields as z.infer<typeof recommenderFieldSchema>[])?.map(field => ({
        ...field,
        required: field.required ?? false,
        helperText: field.helperText ?? null,
        options: field.options ?? [],
      })) || [],
      reminderSchedule: phase.config?.reminderSchedule || "weekly",
      automatedRequestSending: phase.config?.automatedRequestSending ?? false, // Default to false
      requestEmailTemplateId: phase.config?.requestEmailTemplateId || null,
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
      const result = await action(phase.id, parentId, updatedConfig);
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
    { value: "Rich Text Area", label: "Rich Text Area" }, // New type
    { value: "Date", label: "Date Picker" }, // New type
    { value: "Checkbox", label: "Checkbox" }, // New type
    { value: "Radio Group", label: "Radio Group" }, // New type
  ];

  const reminderScheduleOptions = [
    { value: "none", label: "No Reminders" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "bi-weekly", label: "Bi-Weekly" },
  ];

  // Placeholder for fetching actual email templates
  const emailTemplateOptions = [
    { id: "template_1", name: "Recommendation Request Email" },
    { id: "template_2", name: "Recommendation Reminder Email" },
  ];

  return (
    <div className="rounded-xl shadow-lg p-6">
      <div className="p-0 mb-6">
        <h3 className="text-headline-small text-foreground">Recommendation Settings</h3>
        <p className="text-body-medium text-muted-foreground">Configure the requirements and process for recommendations in this phase.</p>
      </div>
      <div className="p-0">
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
            <p className="text-body-medium text-muted-foreground">Define the information applicants must provide about their recommenders, and the fields recommenders will fill out.</p>

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

                {/* Conditional fields for options */}
                {(form.watch(`recommenderInformationFields.${index}.type`) === "Radio Group" || form.watch(`recommenderInformationFields.${index}.type`) === "Checkbox") && (
                  <FormField
                    control={form.control}
                    name={`recommenderInformationFields.${index}.options`}
                    render={({ field: optionsField }) => (
                      <FormItem>
                        <FormLabel className="text-label-large">Options (one per line)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...optionsField}
                            value={optionsField.value?.join("\n") || ""}
                            onChange={(e) => optionsField.onChange(e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}
                            placeholder="Option 1\nOption 2\nOption 3"
                            className="resize-y min-h-[80px] rounded-md"
                            disabled={!canModify}
                          />
                        </FormControl>
                        <FormDescription className="text-body-small">
                          Enter each option on a new line.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                  name={`recommenderInformationFields.${index}.helperText`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Helper Text (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Provide details about your relationship" className="rounded-md" disabled={!canModify} value={field.value || ""} />
                      </FormControl>
                      <FormDescription className="text-body-small">
                        Optional: Short text to guide the recommender.
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
                variant="outlined"
                onClick={() => append({ id: crypto.randomUUID(), label: "", type: "Text", required: true, helperText: null, options: [] })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Field
              </Button>
            )}

            <FormField
              control={form.control}
              name="automatedRequestSending"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-label-large">Automated Request Sending</FormLabel>
                    <FormDescription className="text-body-small">
                      If enabled, recommendation requests will be automatically sent to recommenders.
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

            {form.watch("automatedRequestSending") && (
              <FormField
                control={form.control}
                name="requestEmailTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Request Email Template</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={!canModify}>
                      <FormControl>
                        <SelectTrigger className="rounded-md">
                          <SelectValue placeholder="Select an email template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                        {emailTemplateOptions.length === 0 ? (
                          <SelectItem value="no-templates" disabled className="text-body-medium text-muted-foreground">
                            No email templates available.
                          </SelectItem>
                        ) : (
                          emailTemplateOptions.map((template) => (
                            <SelectItem key={template.id} value={template.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                              {template.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-body-small">
                      The email template to use for sending recommendation requests.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outlined" onClick={onCancel} className="rounded-md text-label-large">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              {canModify && (
                <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Recommendation Configuration</>}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}