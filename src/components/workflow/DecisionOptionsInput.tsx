import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmailTemplate } from "@/types";
import { IconPicker } from "./IconPicker";

interface DecisionOptionsInputProps {
  emailTemplates: EmailTemplate[];
}

export const DecisionOptionsInput = ({ emailTemplates }: DecisionOptionsInputProps) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "decision_options",
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2 mb-2 p-2 border rounded-md">
          <div className="flex-grow grid gap-2">
            <FormField
              control={control}
              name={`decision_options.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Outcome Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={`Outcome ${index + 1}`} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`decision_options.${index}.icon`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Icon</FormLabel>
                  <FormControl>
                    <IconPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`decision_options.${index}.email_template_id`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Email Template</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select email to trigger (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">No email</SelectItem>
                      {emailTemplates.map(template => (
                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        onClick={() => append({ name: "", email_template_id: null, icon: null })}
      >
        Add Outcome
      </Button>
    </div>
  );
};