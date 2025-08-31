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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CampaignPhase } from "../services/campaign-service";
import { createCampaignPhaseAction, updateCampaignPhaseAction } from "../actions";

const campaignPhaseFormSchema = z.object({
  name: z.string().min(1, { message: "Phase name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  type: z.string().min(1, { message: "Phase type is required." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
});

interface CampaignPhaseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  initialData?: CampaignPhase;
  onPhaseSaved: () => void;
  nextOrderIndex: number;
}

export function CampaignPhaseFormDialog({
  isOpen,
  onClose,
  campaignId,
  initialData,
  onPhaseSaved,
  nextOrderIndex,
}: CampaignPhaseFormDialogProps) {
  const form = useForm<z.infer<typeof campaignPhaseFormSchema>>({
    resolver: zodResolver(campaignPhaseFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "",
      description: initialData?.description || "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: initialData?.name || "",
        type: initialData?.type || "",
        description: initialData?.description || "",
      });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (values: z.infer<typeof campaignPhaseFormSchema>) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("type", values.type);
      formData.append("description", values.description || "");
      formData.append("config", JSON.stringify({})); // Initialize with empty config

      let result: CampaignPhase | null;
      if (initialData) {
        result = await updateCampaignPhaseAction(initialData!.id, campaignId, formData);
      } else {
        formData.append("order_index", nextOrderIndex.toString());
        result = await createCampaignPhaseAction(campaignId, formData);
      }

      if (result) {
        onPhaseSaved();
        onClose();
      }
    } catch (error: any) {
      console.error("Campaign phase form submission error:", error);
      toast.error(error.message || "Failed to save campaign phase.");
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-xl shadow-lg bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-headline-small">
            {initialData ? "Edit Campaign Phase" : "Add New Campaign Phase"}
          </DialogTitle>
          <DialogDescription className="text-body-medium text-muted-foreground">
            {initialData
              ? "Update the details of this campaign phase."
              : "Define a new phase for your campaign."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Phase Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Initial Application" {...field} className="rounded-md" />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outlined" onClick={onClose} className="rounded-md text-label-large">
                Cancel
              </Button>
              <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : initialData
                  ? "Save Changes"
                  : "Add Phase"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}