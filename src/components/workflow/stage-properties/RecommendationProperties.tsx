import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { Form as FormType, EmailTemplate } from "@/types";

interface RecommendationPropertiesProps {
  form: UseFormReturn<any>;
  publishedForms: FormType[];
  emailTemplates: EmailTemplate[];
}

export const RecommendationProperties = ({ form, publishedForms, emailTemplates }: RecommendationPropertiesProps) => {
  return (
    <>
      <FormFieldComponent
        control={form.control}
        name="rec_form_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Recommendation Form</FormLabel>
            <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a form for recommenders" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none__">No form selected</SelectItem>
                {publishedForms.map(form => (
                  <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              The form recommenders will fill out. Only published forms are available.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormFieldComponent
          control={form.control}
          name="rec_min_recommenders"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Recommenders</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Minimum number of recommendations required.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldComponent
          control={form.control}
          name="rec_max_recommenders"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Recommenders</FormLabel>
              <FormControl>
                <Input type="number" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormDescription>Maximum number of recommendations allowed.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormFieldComponent
        control={form.control}
        name="rec_reminder_email_template_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reminder Email Template</FormLabel>
            <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select an email template for reminders" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none__">No reminder email</SelectItem>
                {emailTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              This email will be sent to recommenders who haven't submitted.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormFieldComponent
        control={form.control}
        name="rec_reminder_intervals_days"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reminder Intervals (Days)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., 3, 7, 14" />
            </FormControl>
            <FormDescription>
              Comma-separated days relative to the program deadline (e.g., "3, 7" for 3 and 7 days before deadline).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormFieldComponent
        control={form.control}
        name="rec_anonymize_recommender_identity"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Anonymize recommender identity from reviewers
              </FormLabel>
              <FormDescription>
                If checked, recommender names and emails will be hidden from reviewers.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </>
  );
};