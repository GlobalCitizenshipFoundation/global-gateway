"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PlusCircle, Trash2, GripVertical } from "lucide-react";
import { updateApplicationAction } from "../actions";
import { cn } from "@/lib/utils";

// Zod schema for a single checklist item
const checklistItemSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new items
  item: z.string().min(1, "Checklist item is required."),
  checked: z.boolean().default(false), // Ensure checked is always boolean
  notes: z.string().nullable().optional(), // Ensure notes can be null or undefined
});

// Zod schema for the entire screening checklist
const screeningChecklistSchema = z.object({
  checklist: z.array(checklistItemSchema),
});

interface ScreeningChecklistProps {
  applicationId: string;
  initialChecklistData: z.infer<typeof screeningChecklistSchema>['checklist'];
  canModify: boolean;
  onChecklistUpdated: () => void; // Callback to refresh parent data if needed
}

export function ScreeningChecklist({
  applicationId,
  initialChecklistData,
  canModify,
  onChecklistUpdated,
}: ScreeningChecklistProps) {
  // Prepare default values to strictly match the Zod schema's inferred type
  const defaultChecklistItems: z.infer<typeof checklistItemSchema>[] = (initialChecklistData || []).map(item => ({
    id: item.id,
    item: item.item,
    checked: item.checked ?? false, // Ensure 'checked' is always boolean
    notes: item.notes ?? null, // Ensure 'notes' is always string | null
  }));

  const form = useForm<z.infer<typeof screeningChecklistSchema>>({
    resolver: zodResolver(screeningChecklistSchema),
    defaultValues: {
      checklist: defaultChecklistItems,
    },
    mode: "onChange",
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "checklist",
    keyName: "arrayId", // Unique key for each item in the array
  });

  const onSubmit = async (values: z.infer<typeof screeningChecklistSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this checklist.");
      return;
    }
    try {
      const formData = new FormData();
      // Merge the new checklist data into the existing application data JSONB
      // We need to fetch the current application data to merge correctly,
      // but for simplicity, we'll assume `updateApplicationAction` handles merging `data` field.
      // In a more complex scenario, we'd fetch the full application first.
      formData.append("data", JSON.stringify({ screeningChecklist: values.checklist }));

      const result = await updateApplicationAction(applicationId, formData);
      if (result) {
        toast.success("Screening checklist updated successfully!");
        onChecklistUpdated();
      }
    } catch (error: any) {
      console.error("Screening checklist submission error:", error);
      toast.error(error.message || "Failed to save screening checklist.");
    }
  };

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-headline-small text-foreground">Internal Checklist</CardTitle>
        <p className="text-body-medium text-muted-foreground">Track eligibility and screening criteria for this applicant.</p>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {fields.length === 0 && (
              <p className="text-body-medium text-muted-foreground text-center">No checklist items added yet. Click "Add Item" to start.</p>
            )}
            {fields.map((fieldItem, index) => (
              <Card key={fieldItem.arrayId} className="rounded-lg border p-4 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <h4 className="text-title-medium text-foreground">Item #{index + 1}</h4>
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
                      <span className="sr-only">Remove Item</span>
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`checklist.${index}.item`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Checklist Item</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Verified minimum GPA" className="rounded-md" disabled={!canModify} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`checklist.${index}.checked`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canModify}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-label-large cursor-pointer">
                          Completed
                        </FormLabel>
                        <FormDescription className="text-body-small">
                          Mark this item as completed.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`checklist.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Add any relevant notes for this item."
                          className="resize-y min-h-[60px] rounded-md"
                          value={field.value || ""}
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
                onClick={() => append({ id: crypto.randomUUID(), item: "", checked: false, notes: "" })}
                className="w-full rounded-md text-label-large"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Item
              </Button>
            )}

            {canModify && (
              <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Checklist"}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}