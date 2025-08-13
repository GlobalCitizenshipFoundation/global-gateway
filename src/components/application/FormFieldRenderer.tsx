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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Info } from "lucide-react"; // Import Info icon
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import RichTextEditor from "@/components/common/RichTextEditor"; // Updated import path
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components
import DOMPurify from 'dompurify'; // Import DOMPurify

interface FormFieldRendererProps {
  field: FormField;
  submitting: boolean;
}

// Explicitly define the type for dynamic form values
type DynamicFormValues = Record<string, string | string[] | number | undefined | null>;

const FormFieldRenderer = ({ field, submitting }: FormFieldRendererProps) => {
  const { control } = useFormContext<DynamicFormValues>();
  const hasTooltip = field.tooltip && field.tooltip.trim() !== '';
  const sanitizedDescription = field.description ? DOMPurify.sanitize(field.description, { USE_PROFILES: { html: true } }) : null;

  return (
    <FormFieldComponent
      key={field.id}
      control={control}
      name={field.id as keyof DynamicFormValues}
      render={({ field: formHookField }) => (
        <FormItem className="grid gap-2">
          <div className="flex items-center gap-2">
            <FormLabel htmlFor={field.id}>
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            {hasTooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded-md text-sm">
                  {field.tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {sanitizedDescription && <FormDescription className="text-sm text-muted-foreground"><div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} className="prose max-w-none" /></FormDescription>}
          {field.field_type === 'textarea' ? (
            <FormControl>
              <Textarea
                id={field.id}
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                className="min-h-[120px] resize-y"
                placeholder={field.placeholder || undefined} // Use placeholder
              />
            </FormControl>
          ) : field.field_type === 'select' ? (
            <FormControl>
              <Select
                onValueChange={formHookField.onChange}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder={field.placeholder || `Select an option`} /> {/* Use placeholder */}
                </SelectTrigger>
                <SelectContent>
                  {(field.options as string[] || []).map((option, index) => (
                    <SelectItem key={index} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          ) : field.field_type === 'radio' ? (
            <FormControl>
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
            </FormControl>
          ) : field.field_type === 'checkbox' ? (
            <div className="space-y-2">
              {(field.options as string[] || []).map((option, index) => (
                <FormFieldComponent
                  key={option} // Use option as key for individual checkboxes
                  control={control}
                  name={field.id as keyof DynamicFormValues} // Still the same array name
                  render={({ field: checkboxField }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={Array.isArray(checkboxField.value) && checkboxField.value.includes(option)}
                          onCheckedChange={(checked) => {
                            const currentValues = Array.isArray(checkboxField.value) ? checkboxField.value : [];
                            return checked
                              ? checkboxField.onChange([...currentValues, option])
                              : checkboxField.onChange(
                                  currentValues.filter(
                                    (value) => value !== option
                                  )
                                );
                          }}
                          disabled={submitting}
                        />
                      </FormControl>
                      <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          ) : field.field_type === 'email' ? (
            <FormControl>
              <Input
                id={field.id}
                type="email"
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined} // Use placeholder
              />
            </FormControl>
          ) : field.field_type === 'date' ? (
            <FormControl>
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
            </FormControl>
          ) : field.field_type === 'phone' ? (
            <FormControl>
              <Input
                id={field.id}
                type="tel"
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined} // Use placeholder
              />
            </FormControl>
          ) : field.field_type === 'number' ? (
            <FormControl>
              <Input
                id={field.id}
                type="number"
                {...formHookField}
                value={formHookField.value === undefined ? '' : formHookField.value}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined} // Use placeholder
              />
            </FormControl>
          ) : field.field_type === 'richtext' ? (
            <FormControl>
              <RichTextEditor
                value={String(formHookField.value || '')}
                onChange={formHookField.onChange}
                readOnly={submitting}
                className="min-h-[120px]"
              />
            </FormControl>
          ) : ( // Default to text input for any other type
            <FormControl>
              <Input
                id={field.id}
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined} // Use placeholder
              />
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormFieldRenderer;