"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Send } from "lucide-react";
import { Decision } from "../services/evaluation-service";
import { createDecisionAction, updateDecisionAction } from "../actions";
import { getCampaignPhasesAction } from "@/features/campaigns/actions"; // To fetch phase config
import { CampaignPhase } from "@/features/campaigns/services/campaign-service";
import { useSession } from "@/context/SessionContextProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton import

// Zod schema for the decision form
const decisionFormSchema = z.object({
  outcome: z.string().min(1, "Decision outcome is required."),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters.").nullable().optional(),
  isFinal: z.boolean(),
});

interface DecisionFormProps {
  applicationId: string;
  campaignPhaseId: string;
  deciderId: string;
  initialDecision?: Decision;
  onDecisionSaved: () => void;
  onCancel: () => void;
}

export function DecisionForm({
  applicationId,
  campaignPhaseId,
  deciderId,
  initialDecision,
  onDecisionSaved,
  onCancel,
}: DecisionFormProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [campaignPhase, setCampaignPhase] = useState<CampaignPhase | null>(null);
  const [isLoadingPhaseConfig, setIsLoadingPhaseConfig] = useState(true);

  const form = useForm<z.infer<typeof decisionFormSchema>>({
    resolver: zodResolver(decisionFormSchema),
    defaultValues: {
      outcome: initialDecision?.outcome || "",
      notes: initialDecision?.notes || "",
      isFinal: initialDecision?.is_final ?? false,
    },
    mode: "onChange",
  });

  useEffect(() => {
    const fetchPhaseConfig = async () => {
      setIsLoadingPhaseConfig(true);
      try {
        // Assuming campaignId is available from the application context or can be fetched
        // For now, we'll fetch all phases and find the relevant one.
        // In a real app, you might pass campaignId directly or fetch application first.
        const campaignId = initialDecision?.applications?.campaign_id || ''; // Derive campaignId if possible
        const fetchedPhases = await getCampaignPhasesAction(campaignId);
        const currentPhase = fetchedPhases?.find((p: CampaignPhase) => p.id === campaignPhaseId);

        if (!currentPhase) {
          toast.error("Campaign phase not found for decision configuration.");
          onCancel();
          return;
        }
        setCampaignPhase(currentPhase);

        form.reset({
          outcome: initialDecision?.outcome || "",
          notes: initialDecision?.notes || "",
          isFinal: initialDecision?.is_final ?? false,
        });
      } catch (error: any) {
        console.error("Failed to fetch campaign phase config:", error);
        toast.error(error.message || "Failed to load decision configuration.");
        onCancel();
      } finally {
        setIsLoadingPhaseConfig(false);
      }
    };

    if (!isSessionLoading && user) {
      fetchPhaseConfig();
    }
  }, [isSessionLoading, user, campaignPhaseId, initialDecision, onCancel]);

  const onSubmit = async (values: z.infer<typeof decisionFormSchema>) => {
    if (!user) {
      toast.error("You must be logged in to record a decision.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("application_id", applicationId);
      formData.append("campaign_phase_id", campaignPhaseId);
      formData.append("decider_id", deciderId);
      formData.append("outcome", values.outcome);
      formData.append("notes", values.notes || "");
      formData.append("is_final", values.isFinal ? "on" : "off");

      let result: Decision | null;
      if (initialDecision) {
        result = await updateDecisionAction(initialDecision.id, formData);
      } else {
        result = await createDecisionAction(formData);
      }

      if (result) {
        toast.success(`Decision ${initialDecision ? "updated" : "recorded"} successfully!`);
        onDecisionSaved();
      }
    } catch (error: any) {
      console.error("Decision submission error:", error);
      toast.error(error.message || `Failed to ${initialDecision ? "update" : "record"} decision.`);
    }
  };

  if (isLoadingPhaseConfig || isSessionLoading || !user) {
    return (
      <Card className="rounded-xl shadow-lg p-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  // Access config directly from campaignPhase, which is CampaignPhase
  const decisionOutcomes = campaignPhase?.config?.decisionOutcomes || [];

  return (
    <Card className="w-full rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-headline-medium text-primary">
          {initialDecision ? "Edit Decision" : "Record New Decision"}
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Finalize the outcome for this application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Decision Outcome</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select an outcome" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {decisionOutcomes.length === 0 ? (
                        <SelectItem value="no-outcomes" disabled className="text-body-medium text-muted-foreground">
                          No outcomes defined for this phase.
                        </SelectItem>
                      ) : (
                        decisionOutcomes.map((outcome: any) => (
                          <SelectItem key={outcome.id} value={outcome.label} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                            {outcome.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    Choose the final outcome for this application.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal notes or rationale for this decision."
                      className="resize-y min-h-[120px] rounded-md"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    These notes are for internal use only and will not be visible to the applicant.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFinal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-label-large">Mark as Final Decision</FormLabel>
                    <FormDescription className="text-body-small">
                      If enabled, this decision will be considered the final outcome for the application.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel} className="rounded-md text-label-large">
                Cancel
              </Button>
              <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : initialDecision ? (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Update Decision
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Record Decision
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}