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
  head_css_content: z.string().nullable().optional(),
  head_js_content: z.string().nullable().optional(),
  head_enabled: z.boolean(),
  body_end_html_content: z.string().nullable().optional(),
  body_end_css_content: z.string().nullable().optional(),
  body_end_js_content: z.string().nullable().optional(),
  body_end_enabled: z.boolean(),
});

type CustomCodeSettingsFormValues = z.infer<typeof customCodeSettingsSchema>;

interface CustomCodeSettingsFormProps {
  initialData: AppCustomCodeSettings;
}

const CUSTOM_CODE_SETTINGS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Must match the ID in CustomCodeInjector

export const CustomCodeSettingsForm = ({ initialData }: CustomCodeSettingsFormProps) => {
  const { user } = useSession();
  const form = useForm<CustomCodeSettingsFormValues>({
    resolver: zodResolver(customCodeSettingsSchema),
    defaultValues: {
      head_html_content: initialData.head_html_content || '',
      head_css_content: initialData.head_css_content || '',
      head_js_content: initialData.head_js_content || '',
      head_enabled: initialData.head_enabled,
      body_end_html_content: initialData.body_end_html_content || '',
      body_end_css_content: initialData.body_end_css_content || '',
      body_end_js_content: initialData.body_end_js_content || '',
      body_end_enabled: initialData.body_end_enabled,
    },
  });

  const onSubmit = async (values: CustomCodeSettingsFormValues) => {
    if (!user) {
      showError("You must be logged in to save settings.");
      return;
    }

    const payload = {
      ...values,
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
                <FormLabel>HTML Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="<!-- Add custom HTML here -->"
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="head_css_content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CSS Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="/* Add custom CSS here */"
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="head_js_content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>JavaScript Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="// Add custom JavaScript here"
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription className="text-destructive">
                  WARNING: Directly injecting JavaScript is a high security risk. Ensure all code is trusted.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Body End Code Section */}
        <div className="space-y-4 p-4 border rounded-md bg-muted/20">
          <h3 className="text-lg font-semibold">Code before &lt;/body&gt; tag</h3>
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
                <FormLabel>HTML Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="<!-- Add custom HTML here -->"
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="body_end_css_content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CSS Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="/* Add custom CSS here */"
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormFieldComponent
            control={form.control}
            name="body_end_js_content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>JavaScript Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="// Add custom JavaScript here"
                    className="min-h-[200px] font-mono text-sm"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription className="text-destructive">
                  WARNING: Directly injecting JavaScript is a high security risk. Ensure all code is trusted.
                </FormDescription>
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