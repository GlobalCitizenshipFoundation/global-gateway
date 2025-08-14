import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { EvaluationTemplate, WorkflowStage } from "@/types";
import { ReviewFormSourceStageSelect } from "./ReviewFormSourceStageSelect";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert
import { Info } from "lucide-react"; // Import Info icon

interface ReviewPropertiesProps {
  form: UseFormReturn<any>;
  publishedEvaluationTemplates: EvaluationTemplate[];
  allStages: WorkflowStage[];
  currentStageId: string;
}

export const ReviewProperties = ({ form, publishedEvaluationTemplates, allStages, currentStageId }: ReviewPropertiesProps) => {
  const currentStageIndex = allStages.findIndex(s => s.id === currentStageId);
  const availableFormStages = allStages.filter((s, index) =>
    s.step_type === 'form' && index < currentStageIndex
  );

  return (
    <>
      <FormFieldComponent
        control={form.control}
        name="evaluation_template_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Evaluation Rubric</FormLabel>
            <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a scorecard for this stage" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none__">No scorecard attached</SelectItem>
                {publishedEvaluationTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Only published scorecards are available. This scorecard will be used by reviewers at this stage.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      {availableFormStages.length === 0 && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Missing Form Stage</AlertTitle>
          <AlertDescription>
            To configure this review stage, you must have at least one "Form" stage placed *before* it in the workflow.
            Please add a form stage or reorder your workflow.
          </AlertDescription>
        </Alert>
      )}
      <ReviewFormSourceStageSelect
        form={form}
        allStages={allStages}
        currentStageId={currentStageId}
      />
      <FormFieldComponent
        control={form.control}
        name="anonymize_identity"
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
                Anonymize applicant identity in this stage
              </FormLabel>
              <FormDescription>
                If checked, reviewers will not see the applicant's name or email.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </>
  );
};