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
import { PlusCircle, Trash2, GripVertical } from "lucide-react";
import { Phase } from "../../services/pathway-template-service";
import { updatePhaseConfigAction } from "../../actions";
import { cn } from "@/lib/utils";

// Zod schema for a single form field
const formFieldSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new fields
  label: z.string().min(1, "Field label is required."),
  type: z.enum(["Text", "Number", "Date", "Checkbox", "Radio Group", "File Upload", "Rich Text Area", "Email", "URL"]),
  required: z.boolean(), // Removed .default(false)
  helperText: z.string().nullable().optional(),
  defaultValue: z.string().nullable().optional(),
  options: z.array(z.string().min(1, "Option cannot be empty.")).optional(), // For Select, Radio, Checkbox
});

// Zod schema for the entire Form Phase configuration
const formPhaseConfigSchema = z.object({
  fields: z.array(formFieldSchema),
});

interface FormPhaseConfigProps {
  phase: Phase;
  pathwayTemplateId: string;
  onConfigSaved: () => void;
  canModify: boolean;
}

export function FormPhaseConfig({ phase, pathwayTemplateId, onConfigSaved, canModify }: FormPhaseConfigProps) {
  const form = useForm<z.infer<typeof formPhaseConfigSchema>>({
    resolver: zodResolver(formPhaseConfigSchema),
    defaultValues: {
      fields: (phase.config?.fields as z.infer<typeof formFieldSchema>[])?.map(field => ({
        ...field,
        required: field.required ?? false, // Explicitly set default for existing data
      })) || [],
    },
    mode: "onChange",
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "fields",
    keyName: "arrayId", // Unique key for each item in the array
  });

  const onSubmit = async (values: z.infer<typeof formPhaseConfigSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this phase configuration.");
      return;
    }
    try {
      const updatedConfig = { ...phase.config, fields: values.fields };
      const result = await updatePhaseConfigAction(phase.id, pathwayTemplateId, updatedConfig);
      if (result) {
        toast.success("Form phase configuration updated successfully!");
        onConfigSaved();
      }
    } catch (error: any) {
      console.error("Form phase config submission error:", error);
      toast.error(error.message || "Failed to save form phase configuration.");
    }
  };

  const fieldTypes = [
    { value: "Text", label: "Text Input" },
    { value: "Number", label: "Number Input" },
    { value: "Date", label: "Date Picker" },
    { value: "Checkbox", label: "Checkbox" },
    { value: "Radio Group", label: "Radio Group" },
    { value: "File Upload", label: "File Upload" },
    { value: "Rich Text Area", label: "Rich Text Area" },
    { value: "Email", label: "Email Input" },
    { value: "URL", label: "URL Input" },
  ];

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-headline-small text-foreground">Form Fields</CardTitle>
        <p className="text-body-medium text-muted-foreground">Define the input fields for this form phase.</p>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {fields.length === 0 && (
              <p className="text-body-medium text-muted-foreground text-center">No fields added yet. Click "Add Field" to start.</p>
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
                  name={`fields.${index}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Field Label</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Your Full Name" className="rounded-md" disabled={!canModify} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`fields.${index}.type`}
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
                          {fieldTypes.map((type) => (
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
                {(form.watch(`fields.${index}.type`) === "Radio Group" || form.watch(`fields.${index}.type`) === "Checkbox") && (
                  <FormField
                    control={form.control}
                    name={`fields.${index}.options`}
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
                  name={`fields.${index}.required`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-label-large">Required Field</FormLabel>
                        <FormDescription className="text-body-small">
                          Is this field mandatory for submission?
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

                <FormField
                  control={form.control}
                  name={`fields.${index}.helperText`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Helper Text</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Enter your full legal name" className="rounded-md" disabled={!canModify} value={field.value || ""} />
                      </FormControl>
                      <FormDescription className="text-body-small">
                        Optional: Short text to guide the user.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`fields.${index}.defaultValue`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Default Value</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional default value" className="rounded-md" disabled={!canModify} value={field.value || ""} />
                      </FormControl>
                      <FormDescription className="text-body-small">
                        Optional: A pre-filled value for the field.
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
                onClick={() => append({ id: crypto.randomUUID(), label: "", type: "Text", required: false })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Field
              </Button>
            )}

            {canModify && (
              <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Form Configuration"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}