"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phase } from "@/types/supabase"; // Corrected import path
import { updatePhaseBranchingAction, getPhasesAction } from "../actions";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, X } from "lucide-react"; // Import Save and X icons

const branchingFormSchema = z.object({
  next_phase_id_on_success: z.string().uuid("Invalid phase ID.").nullable().optional(),
  next_phase_id_on_failure: z.string().uuid("Invalid phase ID.").nullable().optional(),
});

interface BranchingConfigFormProps {
  pathwayTemplateId: string;
  phase: Phase; // The phase for which branching is being configured
  onConfigSaved: () => void;
  onCancel: () => void; // Added onCancel prop
  canModify: boolean;
}

export function BranchingConfigForm({
  pathwayTemplateId,
  phase,
  onConfigSaved,
  onCancel, // Destructure onCancel
  canModify,
}: BranchingConfigFormProps) {
  const [allPhases, setAllPhases] = useState<Phase[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(true);

  const form = useForm<z.infer<typeof branchingFormSchema>>({
    resolver: zodResolver(branchingFormSchema),
    defaultValues: {
      next_phase_id_on_success: phase.config?.next_phase_id_on_success || null,
      next_phase_id_on_failure: phase.config?.next_phase_id_on_failure || null,
    },
  });

  useEffect(() => {
    const fetchPhases = async () => {
      setIsLoadingPhases(true);
      try {
        const fetchedPhases = await getPhasesAction(pathwayTemplateId);
        if (fetchedPhases) {
          // Filter out the current phase itself from the selectable options
          setAllPhases(fetchedPhases.filter(p => p.id !== phase.id));
        }
      } catch (error) {
        console.error("Failed to fetch phases for branching config:", error);
        toast.error("Failed to load available phases.");
      } finally {
        setIsLoadingPhases(false);
      }
    };

    fetchPhases();
    form.reset({
      next_phase_id_on_success: phase.config?.next_phase_id_on_success || null,
      next_phase_id_on_failure: phase.config?.next_phase_id_on_failure || null,
    });
  }, [pathwayTemplateId, phase, form]);

  const onSubmit = async (values: z.infer<typeof branchingFormSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this phase configuration.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("next_phase_id_on_success", values.next_phase_id_on_success || "");
      formData.append("next_phase_id_on_failure", values.next_phase_id_on_failure || "");

      const result = await updatePhaseBranchingAction(phase.id, pathwayTemplateId, formData);
      if (result) {
        toast.success("Branching configuration updated successfully!");
        onConfigSaved();
      }
    } catch (error: any) {
      console.error("Branching config submission error:", error);
      toast.error(error.message || "Failed to save branching configuration.");
    }
  };

  const isConditionalPhase = phase.type === "Decision" || phase.type === "Review";

  if (!isConditionalPhase) {
    return (
      <div className="rounded-xl shadow-md p-6 bg-muted/20 border border-border">
        <h4 className="text-headline-small text-muted-foreground">Branching Configuration</h4>
        <p className="text-body-medium text-muted-foreground mt-2">
          This phase type ({phase.type}) does not support conditional branching.
        </p>
        <p className="text-body-small text-muted-foreground mt-1">
          Only 'Decision' and 'Review' phases can have conditional branching.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-title-large font-bold text-foreground">Branching Configuration</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <FormField
            control={form.control}
            name="next_phase_id_on_success"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label-large">Next Phase (On Success/Accept)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  value={field.value || "none"}
                  disabled={!canModify || isLoadingPhases}
                >
                  <FormControl>
                    <SelectTrigger className="rounded-md">
                      <SelectValue placeholder={isLoadingPhases ? "Loading phases..." : "Select a phase (optional)"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                    <SelectItem value="none" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                      None (End of Path)
                    </SelectItem>
                    {allPhases.length === 0 && !isLoadingPhases ? (
                      <SelectItem value="no-phases-available" disabled className="text-body-medium text-muted-foreground">
                        No other phases available.
                      </SelectItem>
                    ) : (
                      allPhases.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                          {p.name} ({p.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="next_phase_id_on_failure"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-label-large">Next Phase (On Failure/Reject)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  value={field.value || "none"}
                  disabled={!canModify || isLoadingPhases}
                >
                  <FormControl>
                    <SelectTrigger className="rounded-md">
                      <SelectValue placeholder={isLoadingPhases ? "Loading phases..." : "Select a phase (optional)"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                    <SelectItem value="none" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                      None (End of Path)
                    </SelectItem>
                    {allPhases.length === 0 && !isLoadingPhases ? (
                      <SelectItem value="no-phases-available" disabled className="text-body-medium text-muted-foreground">
                        No other phases available.
                      </SelectItem>
                    ) : (
                      allPhases.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                          {p.name} ({p.type})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outlined" onClick={onCancel} className="rounded-md text-label-large">
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting || !canModify}>
              {form.formState.isSubmitting ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Branching</>}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}