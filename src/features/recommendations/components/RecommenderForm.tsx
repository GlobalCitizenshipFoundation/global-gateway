"use client";

import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Send, CheckCircle, XCircle, CalendarIcon } from "lucide-react"; // Added CalendarIcon
import { RecommendationRequest } from "../services/recommendation-service";
import { submitRecommendationAction } from "../actions";
import { getCampaignPhasesAction } from "@/features/campaigns/actions"; // To fetch phase config
import { CampaignPhase } from "@/features/campaigns/services/campaign-service";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label"; // Added Label import

// Define a schema for a generic form field value
const genericFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.date(),
  z.null(),
  z.undefined(),
]);

// Define a schema for the dynamic form data based on the fields config
const dynamicFormSchema = z.record(z.string(), genericFieldValueSchema);

interface RecommenderFormProps {
  request: RecommendationRequest;
}

export function RecommenderForm({ request }: RecommenderFormProps) {
  const [campaignPhase, setCampaignPhase] = useState<CampaignPhase | null>(null);
  const [isLoadingPhaseConfig, setIsLoadingPhaseConfig] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(request.status === 'submitted');

  const form = useForm<z.infer<typeof dynamicFormSchema>>({
    resolver: zodResolver(dynamicFormSchema), // Use dynamic schema
    defaultValues: {}, // Will be populated dynamically
    mode: "onChange",
  });

  useEffect(() => {
    const fetchPhaseConfig = async () => {
      setIsLoadingPhaseConfig(true);
      try {
        // Ensure request.applications?.campaigns?.id is a string for getCampaignPhasesAction
        const campaignId = request.applications?.campaigns?.id || "";
        const fetchedPhases = await getCampaignPhasesAction(campaignId);
        const currentPhase = fetchedPhases?.find((p: CampaignPhase) => p.id === request.campaign_phase_id);

        if (!currentPhase) {
          toast.error("Campaign phase not found for recommendation configuration.");
          return;
        }
        setCampaignPhase(currentPhase);

        // Dynamically set default values from request.form_data or empty
        const defaultValues: Record<string, any> = {};
        // Access config directly from currentPhase, which is CampaignPhase
        (currentPhase.config?.recommenderInformationFields || []).forEach((field: any) => {
          defaultValues[field.label] = request.form_data?.[field.label] ?? "";
          if (field.type === "Checkbox") {
            defaultValues[field.label] = request.form_data?.[field.label] ?? false;
          } else if (field.type === "Date") {
            defaultValues[field.label] = request.form_data?.[field.label] ? parseISO(request.form_data[field.label]) : null;
          }
        });
        form.reset(defaultValues);
      } catch (error: any) {
        console.error("Failed to fetch campaign phase config:", error);
        toast.error(error.message || "Failed to load recommendation form configuration.");
      } finally {
        setIsLoadingPhaseConfig(false);
      }
    };

    fetchPhaseConfig();
  }, [request, form]);

  const onSubmit = async (values: z.infer<typeof dynamicFormSchema>) => {
    if (isSubmitted) {
      toast.info("This recommendation has already been submitted.");
      return;
    }
    try {
      const submissionData: Record<string, any> = {};
      for (const key in values) {
        if (values.hasOwnProperty(key)) {
          const value = values[key];
          if (value instanceof Date) {
                            submissionData[key] = value.toISOString();
                          } else {
                            submissionData[key] = value;
                          }
                        }
                      }

      // Convert submissionData to FormData
      const formData = new FormData();
      for (const key in submissionData) {
        if (submissionData.hasOwnProperty(key)) {
          formData.append(key, String(submissionData[key]));
        }
      }

      const result = await submitRecommendationAction(request.unique_token, formData);
      if (result) {
        toast.success("Recommendation submitted successfully!");
        setIsSubmitted(true);
      }
    } catch (error: any) {
      console.error("Recommendation submission error:", error);
      toast.error(error.message || "Failed to submit recommendation.");
    }
  };

  if (isLoadingPhaseConfig || !campaignPhase) {
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
  const recommenderInformationFields = campaignPhase.config?.recommenderInformationFields || [];

  return (
    <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-headline-medium text-primary">
          Recommendation for {request.applications?.profiles?.first_name} {request.applications?.profiles?.last_name}
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Please provide your recommendation for the applicant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="text-center space-y-4 p-8">
            <CheckCircle className="h-24 w-24 text-green-600 mx-auto" />
            <h3 className="text-headline-small font-bold text-foreground">Recommendation Submitted!</h3>
            <p className="text-body-large text-muted-foreground">
              Thank you for submitting your recommendation.
            </p>
            {request.submitted_at && (
              <p className="text-body-small text-muted-foreground">
                Submitted on: {format(parseISO(request.submitted_at), "PPP p")}
              </p>
            )}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {recommenderInformationFields.length === 0 ? (
                <p className="text-body-medium text-muted-foreground text-center">No specific fields defined for this recommendation. Please contact the program coordinator.</p>
              ) : (
                recommenderInformationFields.map((fieldConfig: any) => (
                  <FormField
                    key={fieldConfig.id}
                    control={form.control}
                    name={fieldConfig.label} // Use label as the field name
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-label-large">
                          {fieldConfig.label} {fieldConfig.required && <span className="text-destructive">*</span>}
                        </FormLabel>
                        <FormControl>
                          {fieldConfig.type === "Text" || fieldConfig.type === "Email" || fieldConfig.type === "Phone" || fieldConfig.type === "Organization" || fieldConfig.type === "Relationship" ? (
                            <Input
                              type={fieldConfig.type === "Email" ? "email" : fieldConfig.type === "Phone" ? "tel" : "text"}
                              placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
                              {...field}
                              value={field.value === null || field.value === undefined ? "" : String(field.value)} // Ensure string value
                            />
                          ) : fieldConfig.type === "Rich Text Area" ? (
                            <Textarea
                              placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
                              className="resize-y min-h-[120px] rounded-md"
                              {...field}
                              value={field.value === null || field.value === undefined ? "" : String(field.value)} // Ensure string value
                            />
                          ) : fieldConfig.type === "Date" ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outlined"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal rounded-md",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value as Date, "PPP") // Cast to Date
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 rounded-xl shadow-lg bg-card text-card-foreground border-border" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value as Date | undefined} // Cast to Date | undefined
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          ) : fieldConfig.type === "Checkbox" ? (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value as boolean} // Cast to boolean
                                onCheckedChange={field.onChange}
                              />
                              <Label htmlFor={fieldConfig.id}>{fieldConfig.label}</Label>
                            </div>
                          ) : fieldConfig.type === "Radio Group" && fieldConfig.options ? (
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value as string} className="flex flex-col space-y-1">
                              {fieldConfig.options.map((option: string) => (
                                <div key={option} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`${fieldConfig.id}-${option}`} />
                                  <Label htmlFor={`${fieldConfig.id}-${option}`}>{option}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          ) : (
                            <p className="text-destructive text-body-small">Unsupported field type: {fieldConfig.type}</p>
                          )}
                        </FormControl>
                        {fieldConfig.helperText && (
                          <FormDescription className="text-body-small">
                            {fieldConfig.helperText}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))
              )}

              <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting || isSubmitted}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Submit Recommendation
                  </>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}