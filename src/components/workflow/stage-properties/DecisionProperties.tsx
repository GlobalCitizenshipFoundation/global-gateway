import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { DecisionOptionsInput } from "../DecisionOptionsInput";
import { EmailTemplate } from "@/types";

interface DecisionPropertiesProps {
  form: UseFormReturn<any>;
  emailTemplates: EmailTemplate[];
}

export const DecisionProperties = ({ form, emailTemplates }: DecisionPropertiesProps) => {
  return (
    <FormFieldComponent
      control={form.control}
      name="decision_options"
      render={() => (
        <FormItem>
          <FormLabel>Decision Outcomes</FormLabel>
          <FormControl>
            <DecisionOptionsInput emailTemplates={emailTemplates} />
          </FormControl>
          <FormDescription>Define the possible outcomes and trigger an optional email for each.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};