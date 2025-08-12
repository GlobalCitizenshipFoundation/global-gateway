import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkflowStep } from "@/types";
import { Plus, ListPlus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AddWorkflowStepFormProps {
  newStepName: string;
  setNewStepName: (name: string) => void;
  newStepDescription: string;
  setNewStepDescription: (description: string) => void;
  newStepType: WorkflowStep['step_type'];
  setNewStepType: (type: WorkflowStep['step_type']) => void;
  isSubmitting: boolean;
  handleAddStep: (e: React.FormEvent) => void;
}

export const AddWorkflowStepForm = ({
  newStepName,
  setNewStepName,
  newStepDescription,
  setNewStepDescription,
  newStepType,
  setNewStepType,
  isSubmitting,
  handleAddStep,
}: AddWorkflowStepFormProps) => {
  return (
    <form onSubmit={handleAddStep} className="mt-8 pt-8 border-t">
      <h3 className="text-lg font-medium">Add New Step</h3>
      <div className="grid gap-2 mt-4">
        <Input
          placeholder="e.g., 'Initial Review'"
          value={newStepName}
          onChange={e => setNewStepName(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="grid gap-2">
          <Label htmlFor="new-step-type" className="flex items-center gap-1">
            <ListPlus className="h-4 w-4" /> Step Type
          </Label>
          <Select value={newStepType} onValueChange={(value) => setNewStepType(value as WorkflowStep['step_type'])}>
            <SelectTrigger id="new-step-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="decision">Decision</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="new-step-description">Step Description (Optional)</Label>
          <Textarea
            id="new-step-description"
            placeholder="Optional: Describe what happens in this step."
            value={newStepDescription}
            onChange={e => setNewStepDescription(e.target.value)}
            disabled={isSubmitting}
            className="min-h-[60px] resize-y"
          />
        </div>
        <Button type="submit" disabled={isSubmitting || !newStepName.trim()} className="w-full sm:w-auto self-end">
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </div>
    </form>
  );
};