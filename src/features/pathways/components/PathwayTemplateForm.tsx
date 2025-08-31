"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PathwayTemplate } from "../services/pathway-template-service";
import { createPathwayTemplateAction, updatePathwayTemplateAction, updatePathwayTemplateStatusAction } from "../actions"; // Import createPathwayTemplateAction
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Separator } from "@/components/ui/separator"; // Import Separator

const formSchema = z.object({
  name: z.string().min(1, { message: "Template name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
  is_private: z.boolean(),
  status: z.enum(['draft', 'pending_review', 'published', 'archived']), // Added status field
});

interface PathwayTemplateFormProps {
  initialData?: PathwayTemplate;
  onTemplateSaved: (templateId?: string) => void; // Modified to pass templateId
  onCancel: () => void;
  canModify: boolean;
}

export function PathwayTemplateForm({ initialData, onTemplateSaved, onCancel, canModify }: PathwayTemplateFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      is_private: initialData?.is_private ?? false,
      status: initialData?.status || "draft", // Set default status
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name || "",
      description: initialData?.description || "",
      is_private: initialData?.is_private ?? false,
      status: initialData?.status || "draft",
    });
  }, [initialData, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify this template.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");
      formData.append("is_private", values.is_private ? "on" : "off");

      let result: PathwayTemplate | null;
      if (initialData) {
        result = await updatePathwayTemplateAction(initialData.id, formData);
        // If status is also changed, call the status update action
        if (initialData.status !== values.status) {
          await updatePathwayTemplateStatusAction(initialData.id, values.status);
        }
        if (result) {
          toast.success("Pathway template updated successfully!");
          onTemplateSaved(result.id); // Pass ID on update
        }
      } else {
        // Handle creation
        result = await createPathwayTemplateAction(formData);
        if (result) {
          toast.success("Pathway template created successfully!");
          onTemplateSaved(result.id); // Pass ID on creation
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save pathway template.");
    }
  };

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "pending_review", label: "Pending Review" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <Card className="w-full rounded-xl shadow-lg">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small text-primary">
          {initialData ? "Edit Template Details" : "Create New Pathway Template"}
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          {initialData
            ? "Update the core details of your pathway template."
            : "Define a new reusable workflow template for your programs."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-title-large font-bold text-foreground">Basic Information</h3>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Global Fellowship Application" {...field} className="rounded-md" disabled={!canModify} />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      A unique and descriptive name for your pathway template.
                    </FormDescription>
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
                        placeholder="Provide a brief overview of this pathway template's purpose."
                        className="resize-y min-h-[80px] rounded-md"
                        {...field}
                        value={field.value || ""}
                        disabled={!canModify}
                      />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      Optional: A detailed description of what this template is used for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6" />

            {/* Visibility & Status Section */}
            <div className="space-y-4">
              <h3 className="text-title-large font-bold text-foreground">Visibility & Status</h3>
              <FormField
                control={form.control}
                name="is_private"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-label-large">Keep Private</FormLabel>
                      <FormDescription className="text-body-small">
                        If enabled, this template will only be visible to you and platform administrators.
                        Otherwise, it will be visible to all workbench users.
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Template Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canModify}>
                      <FormControl>
                        <SelectTrigger className="rounded-md">
                          <SelectValue placeholder="Select template status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-body-small">
                      The current lifecycle status of the template.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button type="button" variant="outlined" onClick={onCancel} className="rounded-md text-label-large">
                Cancel
              </Button>
              <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting || !canModify}>
                {form.formState.isSubmitting
                  ? "Saving..."
                  : initialData
                  ? "Save Changes"
                  : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}