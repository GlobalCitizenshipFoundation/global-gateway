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
import { Package as PackageType } from "@/features/packages/services/package-service";
import { createPackageAction, updatePackageAction } from "@/features/packages/actions";

const formSchema = z.object({
  name: z.string().min(1, { message: "Package name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
  is_public: z.boolean(),
});

interface PackageFormProps {
  initialData?: PackageType;
}

export function PackageForm({ initialData }: PackageFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      is_public: initialData?.is_public ?? false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");
      formData.append("is_public", values.is_public ? "on" : "off");

      let result: PackageType | null;
      if (initialData) {
        result = await updatePackageAction(initialData.id, formData);
        if (result) {
          toast.success("Package updated successfully!");
          router.push(`/workbench/packages/${result.id}`);
        }
      } else {
        result = await createPackageAction(formData);
        if (result) {
          toast.success("Package created successfully!");
          router.push(`/workbench/packages/${result.id}`);
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save package.");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-headline-medium text-primary">
          {initialData ? "Edit Package" : "Create New Package"}
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          {initialData
            ? "Update the details of your package."
            : "Define a new package to group related campaigns or pathway templates."}
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
                  <FormLabel className="text-label-large">Package Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Global Leadership Programs" {...field} className="rounded-md" />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    A unique and descriptive name for your package.
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
                      placeholder="Provide a brief overview of this package."
                      className="resize-y min-h-[80px] rounded-md"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    Optional: A detailed description of what this package contains.
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
                      If enabled, this package will be visible to all workbench users.
                      Otherwise, it will be visible only to you and platform administrators.
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
                ? "Update Package"
                : "Create Package"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}