import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UseFormReturn } from "react-hook-form";

interface DatePropertiesProps {
  form: UseFormReturn<any>;
}

export const DateProperties = ({ form }: DatePropertiesProps) => {
  return (
    <div className="grid gap-4">
      <h3 className="text-md font-semibold mt-4">Date Picker Settings</h3>
      <FormFieldComponent
        control={form.control}
        name="date_min"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Minimum Date (Optional)</FormLabel>
            <FormControl> {/* Wrap Popover with FormControl */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(new Date(field.value), "PPP")
                    ) : (
                      <span>No minimum date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormDescription>
              Set the earliest date an applicant can select.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormFieldComponent
        control={form.control}
        name="date_max"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Maximum Date (Optional)</FormLabel>
            <FormControl> {/* Wrap Popover with FormControl */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(new Date(field.value), "PPP")
                    ) : (
                      <span>No maximum date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormDescription>
              Set the latest date an applicant can select.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormFieldComponent
        control={form.control}
        name="date_allow_past"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Allow Past Dates
              </FormLabel>
              <FormDescription>
                If unchecked, applicants cannot select dates before today.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
      <FormFieldComponent
        control={form.control}
        name="date_allow_future"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Allow Future Dates
              </FormLabel>
              <FormDescription>
                If unchecked, applicants cannot select dates after today.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};