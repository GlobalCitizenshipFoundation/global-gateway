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

interface ResubmissionPropertiesProps {
  form: UseFormReturn<any>;
  allStages: WorkflowStage[];
  currentStageId: string;
}

export const ResubmissionProperties = ({ form, allStages, currentStageId }: ResubmissionPropertiesProps) => {
  const currentStageIndex = allStages.findIndex(s => s.id === currentStageId);
  const availableResubmissionStages = allStages.filter((s, index) =>
    s.step_type === 'form' && index < currentStageIndex
  );

  return (
    <FormFieldComponent
      control={form.control}
      name="resubmission_for_stage_order"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Form to Resubmit</FormLabel>
          <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : null)} value={String(field.value || '')}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a previous form stage" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableResubmissionStages.map((formStage) => (
                <SelectItem key={formStage.id} value={String(formStage.order_index)}>
                  {formStage.name} (Current Stage {formStage.order_index})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            The applicant will be asked to edit and resubmit the form from this stage.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};