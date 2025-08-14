import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Form as FormType } from "@/types";

interface FormAttachmentPropertiesProps {
  form: UseFormReturn<any>;
  forms: FormType[];
}

export const FormAttachmentProperties = ({ form, forms }: FormAttachmentPropertiesProps) => {
  return (
    <FormFieldComponent
      control={form.control}
      name="form_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Attach Form</FormLabel>
          <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Choose a form for this stage" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="__none__">No form attached</SelectItem>
              {forms.map(form => (
                <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            This form can be assigned to users when they reach this stage.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};