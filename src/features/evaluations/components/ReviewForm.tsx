"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Send } from "lucide-react";
import { Review } from "../services/evaluation-service";
import { createReviewAction, updateReviewAction } from "../actions";
import { getCampaignPhasesAction } from "@/features/campaigns/actions"; // To fetch phase config
import { CampaignPhase } from "@/features/campaigns/services/campaign-service";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton import

// Zod schema for a single rubric score
const rubricScoreSchema = z.object({
  criterionId: z.string(),
  criterionName: z.string(),
  maxScore: z.number(),
  score: z.coerce.number().min(0, "Score cannot be negative.").nullable(), // Changed to .nullable()
});

// Zod schema for the entire review form
const reviewFormSchema = z.object({
  scores: z.array(rubricScoreSchema),
  comments: z.string().max(2000, "Comments cannot exceed 2000 characters.").nullable().optional(),
  status: z.enum(['pending', 'submitted', 'reopened']),
});

interface ReviewFormProps {
  applicationId: string;
  campaignPhaseId: string;
  initialReview?: Review;
  onReviewSaved: () => void;
  onCancel: () => void;
}

export function ReviewForm({
  applicationId,
  campaignPhaseId,
  initialReview,
  onReviewSaved,
  onCancel,
}: ReviewFormProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const router = useRouter();
  const [campaignPhase, setCampaignPhase] = useState<CampaignPhase | null>(null);
  const [isLoadingPhaseConfig, setIsLoadingPhaseConfig] = useState(true);

  const form = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      scores: [],
      comments: initialReview?.comments || "",
      status: initialReview?.status || "pending",
    },
    mode: "onChange",
  });

  const { fields, append, update } = useFieldArray({
    control: form.control,
    name: "scores",
  });

  useEffect(() => {
    const fetchPhaseConfig = async () => {
      setIsLoadingPhaseConfig(true);
      try {
        // Assuming campaignId is available from the application context or can be fetched
        const campaignId = initialReview?.applications?.campaigns?.id || ''; // Derive campaignId if possible
        const fetchedPhases = await getCampaignPhasesAction(campaignId);
        const currentPhase = fetchedPhases?.find((p: CampaignPhase) => p.id === campaignPhaseId);

        if (!currentPhase) {
          toast.error("Campaign phase not found for review configuration.");
          onCancel();
          return;
        }
        setCampaignPhase(currentPhase);

        // Initialize scores based on rubric criteria from phase config
        const rubricCriteria = currentPhase.config?.rubricCriteria || [];
        const defaultScores = rubricCriteria.map((criterion: any) => {
          const existingScore = initialReview?.score?.[criterion.id];
          return {
            criterionId: criterion.id,
            criterionName: criterion.name,
            maxScore: criterion.maxScore,
            score: existingScore !== undefined ? existingScore : null,
          };
        });
        form.reset({
          scores: defaultScores,
          comments: initialReview?.comments || "",
          status: initialReview?.status || "pending",
        });
      } catch (error: any) {
        console.error("Failed to fetch campaign phase config:", error);
        toast.error(error.message || "Failed to load review rubric.");
        onCancel();
      } finally {
        setIsLoadingPhaseConfig(false);
      }
    };

    if (!isSessionLoading && user) {
      fetchPhaseConfig();
    }
  }, [isSessionLoading, user, campaignPhaseId, initialReview, onCancel]);

  const onSubmit = async (values: z.infer<typeof reviewFormSchema>) => {
    if (!user) {
      toast.error("You must be logged in to submit a review.");
      return;
    }

    const formattedScores = values.scores.reduce((acc, current) => {
      if (current.score !== null) {
        acc[current.criterionId] = current.score;
      }
      return acc;
    }, {} as Record<string, number>);

    try {
      const formData = new FormData();
      formData.append("application_id", applicationId);
      formData.append("reviewer_id", user.id);
      formData.append("campaign_phase_id", campaignPhaseId);
      formData.append("score", JSON.stringify(formattedScores));
      formData.append("comments", values.comments || "");
      formData.append("status", values.status);

      let result: Review | null;
      if (initialReview) {
        result = await updateReviewAction(initialReview.id, formData);
      } else {
        result = await createReviewAction(formData);
      }

      if (result) {
        toast.success(`Review ${initialReview ? "updated" : "submitted"} successfully!`);
        onReviewSaved();
      }
    } catch (error: any) {
      console.error("Review submission error:", error);
      toast.error(error.message || `Failed to ${initialReview ? "update" : "submit"} review.`);
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
  const rubricCriteria = campaignPhase?.config?.rubricCriteria || [];
  const allowComments = campaignPhase?.config?.allowComments ?? true;

  return (
    <Card className="w-full rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-headline-medium text-primary">
          {initialReview ? "Edit Your Review" : "Submit Your Review"}
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Evaluate the application based on the defined rubric criteria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h3 className="text-title-large font-bold text-foreground">Rubric Scores</h3>
            {rubricCriteria.length === 0 ? (
              <p className="text-body-medium text-muted-foreground">No rubric criteria defined for this phase.</p>
            ) : (
              <div className="space-y-4">
                {fields.map((fieldItem, index) => (
                  <FormField
                    key={fieldItem.id}
                    control={form.control}
                    name={`scores.${index}.score`}
                    render={({ field }) => (
                      <FormItem className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-label-large flex-grow">
                            {fieldItem.criterionName}
                            <span className="text-body-small text-muted-foreground ml-2">
                              (Max: {fieldItem.maxScore})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Score"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value === "" ? null : Number(e.target.value);
                                field.onChange(value);
                              }}
                              value={field.value === null ? "" : field.value}
                              min={0}
                              max={fieldItem.maxScore}
                              className="w-24 text-center rounded-md"
                            />
                          </FormControl>
                        </div>
                        <FormDescription className="text-body-small">
                          {rubricCriteria[index]?.description}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}

            {allowComments && (
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed feedback here..."
                        className="resize-y min-h-[120px] rounded-md"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      Share your qualitative feedback on the application.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outlined" onClick={onCancel} className="rounded-md text-label-large">
                Cancel
              </Button>
              <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : initialReview ? (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Update Review
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Submit Review
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