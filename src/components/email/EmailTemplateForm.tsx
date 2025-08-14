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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from "@/components/common/RichTextEditor"; // Updated import path
import { EmailTemplate } from "@/types";

const emailTemplateSchema = z.object({
  name: z.string().min(1, { message: "Template name is required." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  body: z.string().min(1, { message: "Email body cannot be empty." }),
  is_default: z.boolean().optional(),
});

type EmailTemplateFormValues = z.infer<typeof emailTemplateSchema>;

interface EmailTemplateFormProps {
  initialData?: EmailTemplate;
  onSubmit: (values: EmailTemplateFormValues) => Promise<void>;
  isSubmitting: boolean;
  isNewTemplate: boolean;
}

export const EmailTemplateForm = ({ initialData, onSubmit, isSubmitting, isNewTemplate }: EmailTemplateFormProps) => {
  const form = useForm<EmailTemplateFormValues>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: initialData?.name || "",
      subject: initialData?.subject || "",
      body: initialData?.body || "",
      is_default: initialData?.is_default || false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormFieldComponent
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Template Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Application Submitted Confirmation" {...field} disabled={isSubmitting || initialData?.is_default} />
              </FormControl>
              <FormDescription>
                A unique name for this email template. Cannot be changed for default templates.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldComponent
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Your Application Has Been Received!" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldComponent
          control={form.control}
          name="body"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Body</FormLabel>
              <FormControl>
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  readOnly={isSubmitting}
                  className="min-h-[300px]"
                  placeholder="Compose your email content here. You can use HTML for rich text."
                />
              </FormControl>
              <FormDescription>
                The main content of your email. Supports rich text formatting.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldComponent
          control={form.control}
          name="is_default"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting || !isNewTemplate} // Only allow setting for new templates
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Default System Template
                </FormLabel>
                <FormDescription>
                  Mark this if this template is intended for system-wide use (e.g., signup, password reset).
                  This can only be set when creating a new template.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isNewTemplate ? "Creating Template..." : "Saving Changes...") : (isNewTemplate ? "Create Template" : "Save Changes")}
        </Button>
      </form>
    </Form>
  );
};