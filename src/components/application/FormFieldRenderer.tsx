import { FormField } from "@/types";
import { useFormContext } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import RichTextEditor from "@/components/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // Import Button

interface FormFieldRendererProps {
  field: FormField;
  submitting: boolean;
}

// Explicitly define the type for dynamic form values
type DynamicFormValues = Record<string, string | string[] | number | undefined | null>;

const FormFieldRenderer = ({ field, submitting }: FormFieldRendererProps) => {
  const { control } = useFormContext<DynamicFormValues>();

  return (
    <FormFieldComponent
      key={field.id}
      control={control}
      name={field.id as keyof DynamicFormValues}
      render={({ field: formHookField }) => (
        <FormItem className="grid gap-2">
          <FormLabel htmlFor={field.id}>
            {field.label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
          <FormControl>
            {field.field_type === 'textarea' ? (
              <Textarea
                id={field.id}
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                className="min-h-[120px] resize-y"
              />
            ) : field.field_type === 'select' ? (
              <Select
                onValueChange={formHookField.onChange}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder={`Select an option`} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options as string[] || []).map((option, index) => (
                    <SelectItem key={index} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.field_type === 'radio' ? (
              <RadioGroup
                onValueChange={formHookField.onChange}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                className="space-y-2"
              >
                {(field.options as string[] || []).map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                    <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : field.field_type === 'checkbox' ? (
              <div className="space-y-2">
                {(field.options as string[] || []).map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.id}-${index}`}
                      checked={Array.isArray(formHookField.value) && formHookField.value.includes(option)}
                      onCheckedChange={(checked) => {
                        const currentValues = Array.isArray(formHookField.value) ? formHookField.value : [];
                        const newValues = checked
                          ? [...currentValues, option]
                          : currentValues.filter(v => v !== option);
                        formHookField.onChange(newValues);
                      }}
                      disabled={submitting}
                    />
                    <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                  </div>
                ))}
              </div>
            ) : field.field_type === 'email' ? (
              <Input
                id={field.id}
                type="email"
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
              />
            ) : field.field_type === 'date' ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !formHookField.value && "text-muted-foreground"
                    )}
                    disabled={submitting}
                  >
                    {typeof formHookField.value === 'string' && formHookField.value ? (
                      format(new Date(formHookField.value), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={typeof formHookField.value === 'string' && formHookField.value ? new Date(formHookField.value) : undefined}
                    onSelect={(date) => formHookField.onChange(date ? date.toISOString() : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : field.field_type === 'phone' ? (
              <Input
                id={field.id}
                type="tel"
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
              />
            ) : field.field_type === 'number' ? (
              <Input
                id={field.id}
                type="number"
                {...formHookField}
                value={formHookField.value === undefined ? '' : formHookField.value}
                required={field.is_required}
                disabled={submitting}
              />
            ) : field.field_type === 'richtext' ? (
              <RichTextEditor
                value={String(formHookField.value || '')}
                onChange={formHookField.onChange}
                readOnly={submitting}
                className="min-h-[120px]"
              />
            ) : ( // Default to text input for any other type
              <Input
                id={field.id}
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormFieldRenderer;