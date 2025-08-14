import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";

export const CriterionOptionsInput = () => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2 mb-2 p-2 border rounded-md">
          <div className="flex-grow grid grid-cols-2 gap-2">
            <FormField
              control={control}
              name={`options.${index}.label`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder={`Option ${index + 1} Label`} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`options.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder={`Value (optional)`} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append({ label: "", value: "" })}
      >
        Add Option
      </Button>
    </div>
  );
};