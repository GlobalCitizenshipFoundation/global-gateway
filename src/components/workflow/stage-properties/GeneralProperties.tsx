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
import { UseFormReturn } from "react-hook-form";

interface GeneralPropertiesProps {
  form: UseFormReturn<any>;
  selectedStageType: string; // Keep this to conditionally render description if needed
}

export const GeneralProperties = ({ form, selectedStageType }: GeneralPropertiesProps) => {
  // Only show generic description for types that don't use it for JSON config
  const showGenericDescription = !['decision', 'status', 'resubmission', 'review', 'recommendation'].includes(selectedStageType);

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
      {showGenericDescription && (
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
    </>
  );
};