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
  const currentStageIndex = allStages.findIndex(s => s.id === currentStageId);
  const availableFormStages = allStages.filter((s, index) =>
    s.step_type === 'form' && index < currentStageIndex
  );

  return (
    <FormFieldComponent
      control={form.control}
      name="review_form_source_stage_order"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Form to Review</FormLabel>
          <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : null)} value={String(field.value || '')}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a previous form stage" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableFormStages.length === 0 ? (
                <SelectItem value="" disabled>No previous form stages available</SelectItem>
              ) : (
                availableFormStages.map((formStage) => (
                  <SelectItem key={formStage.id} value={String(formStage.order_index)}>
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