"use client";

import React, { useEffect, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, Save } from "lucide-react";
import { GlobalSetting } from "@/features/settings/services/global-settings-service";
import { getGlobalSettingAction, updateGlobalSettingAction } from "@/features/settings/actions";
import { Skeleton } from "@/components/ui/skeleton";

// Define a schema for a generic JSONB value
const jsonSchema = z.any()
  .transform((val, ctx) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid JSON format",
        });
        return z.NEVER;
      }
    }
    return val;
  })
  .refine((val: unknown) => typeof val === 'object' && val !== null, { // Explicitly type val and corrected 'refile' to 'refine'
    message: "Value must be a valid JSON object.",
  });

const globalSettingsFormSchema = z.object({
  key: z.string().min(1, "Setting key is required."),
  value: z.string(), // Changed to string for form input
  description: z.string().nullable().optional(),
});

interface SettingFormProps {
  settingKey: string;
  initialData?: GlobalSetting;
  onSettingSaved: () => void;
  canModify: boolean;
}

function SettingForm({ settingKey, initialData, onSettingSaved, canModify }: SettingFormProps) {
  const form = useForm<z.infer<typeof globalSettingsFormSchema>>({
    resolver: zodResolver(globalSettingsFormSchema),
    defaultValues: {
      key: initialData?.key || settingKey,
      value: initialData?.value ? JSON.stringify(initialData.value, null, 2) : "{}",
      description: initialData?.description || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        key: initialData.key,
        value: JSON.stringify(initialData.value, null, 2),
        description: initialData.description || "",
      });
    } else {
      form.reset({
        key: settingKey,
        value: "{}",
        description: "",
      });
    }
  }, [initialData, settingKey, form]);

  const onSubmit = async (values: z.infer<typeof globalSettingsFormSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify global settings.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("key", values.key);
      formData.append("value", values.value); // value is already a string
      formData.append("description", values.description || "");

      const result = await updateGlobalSettingAction(formData);
      if (result) {
        toast.success(`Setting '${result.key}' updated successfully!`);
        onSettingSaved();
      }
    } catch (error: any) {
      console.error("Global setting submission error:", error);
      toast.error(error.message || "Failed to save global setting.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-label-large">Setting Key</FormLabel>
              <FormControl>
                <Input {...field} className="rounded-md" disabled /> {/* Key is not editable */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-label-large">Value (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder='{"default_value": "example"}'
                  className="resize-y min-h-[150px] rounded-md font-mono text-sm"
                  disabled={!canModify}
                  value={field.value === null || field.value === undefined ? "" : String(field.value)} // Ensure string value
                />
              </FormControl>
              <FormDescription className="text-body-small">
                Enter the setting value as a valid JSON object.
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
              <FormLabel className="text-label-large">Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="A brief description of what this setting controls."
                  className="resize-y min-h-[80px] rounded-md"
                  disabled={!canModify}
                  value={field.value === null || field.value === undefined ? "" : String(field.value)} // Ensure string value
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {canModify && (
          <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Setting"}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </Button>
        )}
      </form>
    </Form>
  );
}

export default function GlobalSettingsPage() {
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canModify, setCanModify] = useState(false); // State to control modification rights

  // Define the list of global settings keys we expect to manage
  const predefinedSettingKeys = [
    "default_email_subject",
    "default_review_scale",
    "default_form_field_validation_rules",
    "default_interview_duration",
    "default_buffer_time",
    "default_recommenders_required",
    "platform_contact_email",
  ];

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const fetchedSettings: GlobalSetting[] = [];
      for (const key of predefinedSettingKeys) {
        const setting = await getGlobalSettingAction(key);
        if (setting) {
          fetchedSettings.push(setting);
        } else {
          // If a setting doesn't exist, create a default placeholder
          fetchedSettings.push({
            key: key,
            value: {}, // Empty JSON object as default
            description: `Default setting for ${key.replace(/_/g, ' ')}.`,
            updated_at: new Date().toISOString(),
          });
        }
      }
      setSettings(fetchedSettings);
      setCanModify(true); // If we successfully fetched, assume admin access for now
    } catch (error: any) {
      console.error("Error fetching global settings:", error);
      toast.error(error.message || "Failed to load global settings.");
      setCanModify(false); // If there's an error, assume no modification rights
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingSaved = () => {
    fetchSettings(); // Re-fetch all settings to ensure consistency
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-10 w-1/2 mb-4" />
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="rounded-xl shadow-md p-6">
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-10 w-full mt-4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <h1 className="text-display-small font-bold text-foreground flex items-center gap-2">
        <Settings className="h-7 w-7 text-primary" /> Global Settings
      </h1>
      <p className="text-headline-small text-muted-foreground">
        Manage platform-wide default configurations.
      </p>

      <div className="space-y-8">
        {settings.map((setting) => (
          <Card key={setting.key} className="rounded-xl shadow-lg p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-headline-small text-foreground">{setting.key.replace(/_/g, ' ').toUpperCase()}</CardTitle>
              <CardDescription className="text-body-medium text-muted-foreground">
                {setting.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <SettingForm
                settingKey={setting.key}
                initialData={setting}
                onSettingSaved={handleSettingSaved}
                canModify={canModify}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}