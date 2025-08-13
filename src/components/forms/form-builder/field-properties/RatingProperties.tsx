import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface RatingPropertiesProps {
  form: UseFormReturn<any>;
}

export const RatingProperties = ({ form }: RatingPropertiesProps) => {
  return (
    <div className="grid gap-4">
      <h3 className="text-md font-semibold mt-4">Rating Scale Settings</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormFieldComponent
          control={form.control}
          name="rating_min_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Value</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 1" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldComponent
          control={form.control}
          name="rating_max_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Value</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 10" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormFieldComponent
          control={form.control}
          name="rating_min_label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Value Label</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Not at all likely" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFieldComponent
          control={form.control}
          name="rating_max_label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Value Label</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Extremely likely" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormDescription>
        Define the range and labels for your rating scale.
      </FormDescription>
    </div>
  );
};