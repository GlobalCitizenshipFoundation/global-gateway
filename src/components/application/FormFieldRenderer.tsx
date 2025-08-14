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
import { CalendarIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import RichTextEditor from "@/components/common/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import DOMPurify from 'dompurify';
import { Slider } from "@/components/ui/slider"; // Import Slider

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
            <FormLabel htmlFor={field.id} className="text-lg font-semibold"> {/* Adjusted typography */}
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            {hasTooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{field.tooltip}</p>
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
                placeholder={field.placeholder || undefined}
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
                  <SelectValue placeholder={field.placeholder || `Select an option`} />
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
                  key={option}
                  control={control}
                  name={field.id as keyof DynamicFormValues}
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
                placeholder={field.placeholder || undefined}
              />
            </FormControl>
          ) : field.field_type === 'date' ? (
            <FormControl> {/* Wrap Popover with FormControl */}
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
                    // Apply date constraints
                    fromDate={field.date_allow_past ? undefined : new Date()}
                    toDate={field.date_allow_future ? undefined : new Date()}
                    disabled={(date) => {
                      const minDate = field.date_min ? new Date(field.date_min) : null;
                      const maxDate = field.date_max ? new Date(field.date_max) : null;
                      if (minDate && date < minDate) return true;
                      if (maxDate && date > maxDate) return true;
                      return false;
                    }}
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
                placeholder={field.placeholder || undefined}
              />
            </FormControl>
          ) : field.field_type === 'number' ? (
            <FormControl>
              <Input
                id={field.id}
                type="number"
                {...formHookField}
                // Ensure value is always string or undefined for number input
                value={formHookField.value === undefined || formHookField.value === null ? '' : formHookField.value}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined}
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
          ) : field.field_type === 'rating' ? (
            <FormControl>
              <div className="grid gap-2">
                <Slider
                  id={field.id}
                  min={field.rating_min_value ?? 1}
                  max={field.rating_max_value ?? 5}
                  step={1}
                  value={[Number(formHookField.value) || (field.rating_min_value ?? 1)]}
                  onValueChange={(val) => formHookField.onChange(val[0])}
                  disabled={submitting}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{field.rating_min_label || field.rating_min_value}</span>
                  <span>{field.rating_max_label || field.rating_max_value}</span>
                </div>
                <Input
                  type="hidden"
                  {...formHookField}
                  value={Number(formHookField.value) || (field.rating_min_value ?? 1)}
                />
              </div>
            </FormControl>
          ) : (
            <FormControl>
              <Input
                id={field.id}
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined}
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