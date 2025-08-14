import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/common/RichTextEditor";
import { UseFormReturn } from "react-hook-form";

interface StatusPropertiesProps {
  form: UseFormReturn<any>;
}

export const StatusProperties = ({ form }: StatusPropertiesProps) => {
  const selectedStatusTag = form.watch("status_tag");

  return (
    <>
      <FormFieldComponent
        control={form.control}
        name="status_tag"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Message Tag</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Info">Info</SelectItem>
                <SelectItem value="Guideline">Guideline</SelectItem>
                <SelectItem value="Update">Update</SelectItem>
                <SelectItem value="Instruction">Instruction</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      {selectedStatusTag === 'Custom' && (
        <FormFieldComponent
          control={form.control}
          name="status_custom_tag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Tag Text</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter custom tag" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormFieldComponent
        control={form.control}
        name="status_message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status Message</FormLabel>
            <FormControl>
              <RichTextEditor value={field.value || ''} onChange={field.onChange} />
            </FormControl>
            <FormDescription>This content will be displayed to the user at this stage.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};