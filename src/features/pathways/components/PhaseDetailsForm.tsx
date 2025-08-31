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
import { Phase } from "@/types/supabase"; // Import from types/supabase
import { createPhaseAction, updatePhaseAction } from "../actions";
import { Save, X, CalendarDays, Archive } from "lucide-react"; // Import Save, X, CalendarDays icons, Archive icon
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch"; // Import Switch

const phaseFormSchema = z.object({
  name: z.string().min(1, { message: "Phase name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  type: z.string().min(1, { message: "Phase type is required." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
  phase_start_date: z.date().nullable().optional(), // New field
  phase_end_date: z.date().nullable().optional(), // New field
  applicant_instructions: z.string().max(5000, { message: "Applicant instructions cannot exceed 5000 characters." }).nullable().optional(), // New field
  manager_instructions: z.string().max(5000, { message: "Manager instructions cannot exceed 5000 characters." }).nullable().optional(), // New field
  is_visible_to_applicants: z.boolean().optional(), // New field
});

interface PhaseDetailsFormProps {
  pathwayTemplateId: string;
  initialData?: Phase; // Optional for creation
  onPhaseSaved: () => void;
  onCancel: () => void; // Added onCancel prop
  nextOrderIndex: number; // Only relevant for creation, but kept for consistency
  canModify: boolean;
  isNewPhaseForm?: boolean; // New prop to distinguish creation form
}

export function PhaseDetailsForm({
  pathwayTemplateId,
  initialData,
  onPhaseSaved,
  onCancel,
  nextOrderIndex,
  canModify,
  isNewPhaseForm = false,
}: PhaseDetailsFormProps) {
  const form = useForm<z.infer<typeof phaseFormSchema>>({
    resolver: zodResolver(phaseFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "",
      description: initialData?.description || "",
      phase_start_date: initialData?.phase_start_date ? new Date(initialData.phase_start_date) : null,
      phase_end_date: initialData?.phase_end_date ? new Date(initialData.phase_end_date) : null,
      applicant_instructions: initialData?.applicant_instructions || "",
      manager_instructions: initialData?.manager_instructions || "",
      is_visible_to_applicants: initialData?.is_visible_to_applicants ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name || "",
      type: initialData?.type || "",
      description: initialData?.description || "",
      phase_start_date: initialData?.phase_start_date ? new Date(initialData.phase_start_date) : null,
      phase_end_date: initialData?.phase_end_date ? new Date(initialData.phase_end_date) : null,
      applicant_instructions: initialData?.applicant_instructions || "",
      manager_instructions: initialData?.manager_instructions || "",
      is_visible_to_applicants: initialData?.is_visible_to_applicants ?? true,
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
      formData.append("phase_start_date", values.phase_start_date ? values.phase_start_date.toISOString() : "");
      formData.append("phase_end_date", values.phase_end_date ? values.phase_end_date.toISOString() : "");
      formData.append("applicant_instructions", values.applicant_instructions || "");
      formData.append("manager_instructions", values.manager_instructions || "");
      formData.append("is_visible_to_applicants", values.is_visible_to_applicants ? "on" : "off");

      let result: Phase | null;
      if (initialData) {
        result = await updatePhaseAction(initialData.id, pathwayTemplateId, formData);
      } else {
        formData.append("order_index", nextOrderIndex.toString());
        result = await createPhaseAction(pathwayTemplateId, formData);
      }

      if (result) {
        toast.success(`Phase ${initialData ? "updated" : "created"} successfully!`);
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
    { value: "Screening", label: "Screening" },
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canModify || !!initialData}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phase_start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-label-large">Phase Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={!canModify}>
                          <FormControl>
                            <Button
                              variant="outlined"
                              className={cn(
                                "w-full pl-3 text-left font-normal rounded-md",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl shadow-lg bg-card text-card-foreground border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-body-small">
                        The date when this phase officially begins.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phase_end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-label-large">Phase End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={!canModify}>
                          <FormControl>
                            <Button
                              variant="outlined"
                              className={cn(
                                "w-full pl-3 text-left font-normal rounded-md",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl shadow-lg bg-card text-card-foreground border-border" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-body-small">
                        The date when this phase officially ends.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="applicant_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Applicant Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Instructions visible to applicants for this phase."
                        className="resize-y min-h-[80px] rounded-md"
                        {...field}
                        value={field.value || ""}
                        disabled={!canModify}
                      />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      These instructions will be visible to applicants in their portal.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manager_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Manager Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Instructions visible to managers/recruiters for this phase."
                        className="resize-y min-h-[80px] rounded-md"
                        {...field}
                        value={field.value || ""}
                        disabled={!canModify}
                      />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      These instructions are for internal staff only (e.g., hiring managers, recruiters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_visible_to_applicants"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-label-large">Visible to Applicants</FormLabel>
                      <FormDescription className="text-body-small">
                        Control whether this phase is visible in the applicant's workflow view.
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

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outlined" onClick={onCancel} className="rounded-md text-label-large">
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting || !canModify}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : initialData
                    ? <><Save className="mr-2 h-4 w-4" /> Save Changes</>
                    : <><Save className="mr-2 h-4 w-4" /> Add Phase</>}
                </Button>
              </div>
            </form>
          </Form>
        </div>
  );
}