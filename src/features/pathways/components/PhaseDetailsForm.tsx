"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phase } from "../services/pathway-template-service";
import { createPhaseAction, updatePhaseAction } from "../actions";
// Removed unused Card imports as per previous instruction to remove outer Card elements

const phaseFormSchema = z.object({
  name: z.string().min(1, { message: "Phase name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  type: z.string().min(1, { message: "Phase type is required." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
});

interface PhaseDetailsFormProps {
  pathwayTemplateId: string;
  initialData?: Phase; // Optional for creation
  onPhaseSaved: () => void;
  onCancel: () => void;
  nextOrderIndex: number; // Only relevant for creation, but kept for consistency
  canModify: boolean;
}

export function PhaseDetailsForm({
  pathwayTemplateId,
  initialData,
  onPhaseSaved,
  onCancel,
  nextOrderIndex,
  canModify,
}: PhaseDetailsFormProps) {
  const form = useForm<z.infer<typeof phaseFormSchema>>({
    resolver: zodResolver(phaseFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "",
      description: initialData?.description || "",
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name || "",
      type: initialData?.type || "",
      description: initialData?.description || "",
    });
  }, [initialData, form]);

  const onSubmit = async (values: z.infer<typeof phaseFormSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify phases.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("description", values.description || "");

      let result: Phase | null;
      if (initialData) {
        result = await updatePhaseAction(initialData.id, pathwayTemplateId, formData);
      } else {
        formData.append("order_index", nextOrderIndex.toString());
        result = await createPhaseAction(pathwayTemplateId, formData);
      }

      if (result) {
        onPhaseSaved();
      }
    } catch (error: any) {
      console.error("Phase form submission error:", error);
      toast.error(error.message || "Failed to save phase.");
    }
  };

  const phaseTypes = [
    { value: "Form", label: "Form" },
    { value: "Review", label: "Review" },
    { value: "Email", label: "Email" },
    { value: "Scheduling", label: "Scheduling" },
    { value: "Decision", label: "Decision" },
    { value: "Recommendation", label: "Recommendation" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-title-large font-bold text-foreground">Phase Details</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label-large">Phase Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Initial Application" {...field} className="rounded-md" disabled={!canModify} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label-large">Phase Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canModify || !!initialData}> {/* Disable type change on edit */}
                  <FormControl>
                    <SelectTrigger className="rounded-md">
                      <SelectValue placeholder="Select a phase type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                        {phaseTypes.map((type) => (
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional description for this phase."
                        className="resize-y min-h-[80px] rounded-md"
                        {...field}
                        value={field.value || ""}
                        disabled={!canModify}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outlined" onClick={onCancel} className="rounded-md text-label-large">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting || !canModify}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : initialData
                    ? "Save Changes"
                    : "Add Phase"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
  );
}