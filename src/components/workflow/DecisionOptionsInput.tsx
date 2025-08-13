import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";

export const DecisionOptionsInput = () => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "decision_options",
  });

  return (
    <div>
      {fields.map((field, index) => (
        <FormField
          control={control}
          key={field.id}
          name={`decision_options.${index}`}
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 mb-2">
              <FormControl>
                <Input {...field} placeholder={`Outcome ${index + 1}`} />
              </FormControl>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append("")}
      >
        Add Outcome
      </Button>
    </div>
  );
};