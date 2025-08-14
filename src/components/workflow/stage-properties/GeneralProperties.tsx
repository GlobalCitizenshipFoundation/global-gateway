import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { EmailTemplate } from "@/types";

interface GeneralPropertiesProps {
  form: UseFormReturn<any>;
  emailTemplates: EmailTemplate[];
  selectedStageType: string;
}

export const GeneralProperties = ({ form, emailTemplates, selectedStageType }: GeneralPropertiesProps) => {
  return (
    <>
      <FormFieldComponent
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Stage Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Initial Review" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {selectedStageType !== 'decision' && selectedStageType !== 'status' && selectedStageType !== 'resubmission' && selectedStageType !== 'recommendation' && (
        <FormFieldComponent
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the purpose of this stage" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormFieldComponent
        control={form.control}
        name="email_template_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trigger Email (Optional)</FormLabel>
            <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an email template" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none__">No email attached</SelectItem>
                {emailTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              This email will be sent when an applicant reaches this stage.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};