import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppCustomCodeSettings } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useSession } from "@/contexts/auth/SessionContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const customCodeSettingsSchema = z.object({
  head_html_content: z.string().nullable().optional(),
  head_enabled: z.boolean(),
  body_end_html_content: z.string().nullable().optional(),
  body_end_enabled: z.boolean(),
});

type CustomCodeSettingsFormValues = z.infer<typeof customCodeSettingsSchema>;

interface CustomCodeSettingsFormProps {
  initialData: AppCustomCodeSettings;
}

const CUSTOM_CODE_SETTINGS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export const CustomCodeSettingsForm = ({ initialData }: CustomCodeSettingsFormProps) => {
  const { user } = useSession();
  const form = useForm<CustomCodeSettingsFormValues>({
    resolver: zodResolver(customCodeSettingsSchema),
    defaultValues: {
      head_html_content: initialData.head_html_content || '',
      head_enabled: initialData.head_enabled,
      body_end_html_content: initialData.body_end_html_content || '',
      body_end_enabled: initialData.body_end_enabled,
    },
  });

  const onSubmit = async (values: CustomCodeSettingsFormValues) => {
    if (!user) {
      showError("You must be logged in to save settings.");
      return;
    }

    const payload = {
      head_html_content: values.head_html_content || null,
      head_css_content: null, // Explicitly set to null as we are consolidating
      head_js_content: null, // Explicitly set to null as we are consolidating
      head_enabled: values.head_enabled,
      body_end_html_content: values.body_end_html_content || null,
      body_end_css_content: null, // Explicitly set to null as we are consolidating
      body_end_js_content: null, // Explicitly set to null as we are consolidating
      last_edited_by_user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('app_custom_code_settings')
      .update(payload)
      .eq('id', CUSTOM_CODE_SETTINGS_ID);

    if (error) {
      showError(`Failed to save settings: ${error.message}`);
    } else {
      showSuccess("Custom code settings saved successfully!");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!form.formState.isValid && form.formState.isSubmitted && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Validation Error</AlertTitle>
            <AlertDescription>
              Please correct any errors in the code fields.
            </AlertDescription>
          </Alert>
        )}

        {/* Header Code Section */}
        <div className="space-y-4 p-4 border rounded-md bg-muted/20">
          <h3 className="text-lg font-semibold">Code for &lt;head&gt; section</h3>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Extreme Caution Advised!</AlertTitle>
            <AlertDescription>
              Code injected here runs on every page. Incorrect or malicious code can break your site, compromise user data, or introduce severe security vulnerabilities (e.g., Cross-Site Scripting - XSS). Only insert code from trusted sources. You are fully responsible for the code you insert.
            </AlertDescription>
          </Alert>
          <FormFieldComponent
            control={form.control}
            name="head_enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Enable Head Code
                  </FormLabel>
                  <FormDescription>
                    Toggle to enable or disable all custom code injected into the &lt;head&gt; section.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="head_html_content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Combined HTML, CSS, and JavaScript</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={`<!-- Add custom HTML, CSS (<style>), and JavaScript (<script>) here -->\n<style>\n  body { font-family: 'Arial', sans-serif; }\n</style>\n<script>\n  console.log('Custom script loaded!');\n</script>`}
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Body End Code Section */}
        <div className="space-y-4 p-4 border rounded-md bg-muted/20">
          <h3 className="text-lg font-semibold">Code before &lt;/body&gt; tag</h3>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Extreme Caution Advised!</AlertTitle>
            <AlertDescription>
              Code injected here runs on every page. Incorrect or malicious code can break your site, compromise user data, or introduce severe security vulnerabilities (e.g., Cross-Site Scripting - XSS). Only insert code from trusted sources. You are fully responsible for the code you insert.
            </AlertDescription>
          </Alert>
          <FormFieldComponent
            control={form.control}
            name="body_end_enabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Enable Body End Code
                  </FormLabel>
                  <FormDescription>
                    Toggle to enable or disable all custom code injected before the &lt;/body&gt; tag.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="body_end_html_content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Combined HTML, CSS, and JavaScript</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={`<!-- Add custom HTML, CSS (<style>), and JavaScript (<script>) here -->\n<script>\n  // Example: Initialize a third-party analytics script\n  window.myAnalytics = { init: true };\n</script>`}
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">Save All Settings</Button>
      </form>
    </Form>
  );
};