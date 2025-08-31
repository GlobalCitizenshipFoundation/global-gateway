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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CommunicationTemplate, createCommunicationTemplateAction, updateCommunicationTemplateAction } from "@/features/communications"; // Updated import to barrel file

const formSchema = z.object({
  name: z.string().min(1, { message: "Template name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  subject: z.string().min(1, { message: "Subject is required." }).max(200, { message: "Subject cannot exceed 200 characters." }),
  body: z.string().min(1, { message: "Body is required." }).max(5000, { message: "Body cannot exceed 5000 characters." }),
  type: z.enum(['email', 'in-app', 'sms'], { message: "Invalid template type." }),
  is_public: z.boolean(),
});

interface CommunicationTemplateFormProps {
  initialData?: CommunicationTemplate;
}

export function CommunicationTemplateForm({ initialData }: CommunicationTemplateFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      subject: initialData?.subject || "",
      body: initialData?.body || "",
      type: initialData?.type || "email",
      is_public: initialData?.is_public ?? false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("subject", values.subject);
      formData.append("body", values.body);
      formData.append("type", values.type);
      formData.append("is_public", values.is_public ? "on" : "off");

      let result: CommunicationTemplate | null;
      if (initialData) {
        result = await updateCommunicationTemplateAction(initialData.id, formData);
        if (result) {
          toast.success("Communication template updated successfully!");
          router.push(`/communications/templates`); // Corrected path
        }
      } else {
        result = await createCommunicationTemplateAction(formData);
        if (result) {
          toast.success("Communication template created successfully!");
          router.push(`/communications/templates`); // Corrected path
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save communication template.");
    }
  };

  const templateTypes = [
    { value: "email", label: "Email" },
    { value: "in-app", label: "In-App Notification" },
    { value: "sms", label: "SMS Message" },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-headline-medium text-primary">
          {initialData ? "Edit Communication Template" : "Create New Communication Template"}
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          {initialData
            ? "Update the details of your communication template."
            : "Define a new reusable template for emails, in-app notifications, or SMS messages."}
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
                    <Input placeholder="e.g., Application Accepted Email" {...field} className="rounded-md" />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    A unique and descriptive name for your communication template.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Template Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select template type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      {templateTypes.map((type) => (
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
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Your Global Fellowship Application Status" {...field} className="rounded-md" />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    The subject line for emails or a short title for in-app notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Body</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Dear {{applicant_name}}, your application has been accepted..."
                      className="resize-y min-h-[150px] rounded-md"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    The main content of the communication. Supports dynamic placeholders.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-label-large">Make Public</FormLabel>
                    <FormDescription className="text-body-small">
                      If enabled, this template will be visible to all workbench users. Otherwise, it's private to you and admins.
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