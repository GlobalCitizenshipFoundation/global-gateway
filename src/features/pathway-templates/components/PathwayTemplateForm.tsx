"use client";

import React from "react";
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
import { createPathwayTemplateAction, updatePathwayTemplateAction } from "../actions";

const formSchema = z.object({
  name: z.string().min(1, { message: "Template name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
  is_private: z.boolean(),
});

interface PathwayTemplateFormProps {
  initialData?: PathwayTemplate;
}

export function PathwayTemplateForm({ initialData }: PathwayTemplateFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      is_private: initialData?.is_private ?? false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");
      formData.append("is_private", values.is_private ? "on" : "off");

      let result: PathwayTemplate | null;
      if (initialData) {
        result = await updatePathwayTemplateAction(initialData.id, formData);
        if (result) {
          toast.success("Pathway template updated successfully!");
          router.push(`/workbench/pathway-templates/${result.id}`);
        }
      } else {
        result = await createPathwayTemplateAction(formData);
        if (result) {
          toast.success("Pathway template created successfully!");
          router.push(`/workbench/pathway-templates/${result.id}`);
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save pathway template.");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-headline-medium text-primary">
          {initialData ? "Edit Pathway Template" : "Create New Pathway Template"}
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          {initialData
            ? "Update the details of your pathway template."
            : "Define a new reusable workflow template for your programs."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Global Fellowship Application" {...field} className="rounded-md" />
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
                    />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    Optional: A detailed description of what this template is used for.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving..."
                : initialData
                ? "Update Template"
                : "Create Template"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}