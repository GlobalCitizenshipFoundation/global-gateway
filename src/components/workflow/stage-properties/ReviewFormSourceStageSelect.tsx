import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { WorkflowStage } from "@/types";

interface ReviewFormSourceStageSelectProps {
  form: UseFormReturn<any>;
  allStages: WorkflowStage[];
  currentStageId: string;
}

export const ReviewFormSourceStageSelect = ({ form, allStages, currentStageId }: ReviewFormSourceStageSelectProps) => {
  // Filter to get only 'form' type stages, regardless of their order
  const availableFormStages = allStages.filter((s: WorkflowStage) =>
    s.step_type === 'form'
  );

  return (
    <FormFieldComponent
      control={form.control}
      name="review_form_source_stage_id" // Changed name to use ID
      render={({ field }) => (
        <FormItem>
          <FormLabel>Form to Review</FormLabel>
          <Select onValueChange={(val) => field.onChange(val === '__none__' ? null : val)} value={field.value || ''}> {/* Pass string ID directly */}
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a form stage" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableFormStages.length === 0 ? (
                <SelectItem value="__none__" disabled>No form stages available</SelectItem>
              ) : (
                availableFormStages.map((formStage: WorkflowStage) => (
                  <SelectItem key={formStage.id} value={formStage.id}> {/* Use formStage.id as value */}
                    {formStage.name} (Stage {formStage.order_index})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormDescription>
            The form submitted by the applicant in this selected stage will be displayed to reviewers.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};