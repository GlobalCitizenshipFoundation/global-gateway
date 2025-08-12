import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "@/components/RichTextEditor";
import { useWorkflowBuilderState } from "@/hooks/useWorkflowBuilderState";
import { useWorkflowBuilderHandlers } from "@/hooks/useWorkflowBuilderHandlers";
import { useEffect } from "react";

interface WorkflowTemplateDetailsCardProps {
  state: ReturnType<typeof useWorkflowBuilderState>;
}

export const WorkflowTemplateDetailsCard = ({ state }: WorkflowTemplateDetailsCardProps) => {
  const {
    templateName, setTemplateName,
    templateDescription, setTemplateDescription,
    templateStatus,
    templateLastEditedAt,
    lastEditedByUserName,
    hasUnsavedChanges,
    isAutoSaving,
    showSavedConfirmation,
    loading,
  } = state;

  const { triggerAutoSave } = useWorkflowBuilderHandlers({
    state,
    performUpdateTemplateDetails: async (id, name, description) => {
      // This is a dummy function for the handler to call.
      // The actual update logic is in useWorkflowBuilderActions.
      // We'll just return true for now to allow auto-save feedback.
      return true;
    },
    performUpdateTemplateStatus: async (id, status) => {
      // Dummy function
      return true;
    },
  });

  useEffect(() => {
    if (!loading) {
      triggerAutoSave();
    }
  }, [templateName, templateDescription, state.workflowSteps, loading, triggerAutoSave]);

  const renderStatusMessage = () => {
    if (isAutoSaving) {
      return <span className="text-blue-500">Saving...</span>;
    }
    if (showSavedConfirmation) {
      return <span className="text-green-500">Saved!</span>;
    }
    if (hasUnsavedChanges) {
      return <span className="text-orange-500">Unsaved changes</span>;
    }
    return null;
  };

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>
              Workflow Template: {templateName}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Design your workflow template. Current Status: <Badge variant={templateStatus === 'published' ? 'default' : 'secondary'}>{templateStatus.charAt(0).toUpperCase() + templateStatus.slice(1)}</Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            {templateLastEditedAt && (
              <p>Last updated: {new Date(templateLastEditedAt).toLocaleString()}</p>
            )}
            {lastEditedByUserName && (
              <p className="text-xs">By: {lastEditedByUserName}</p>
            )}
            {renderStatusMessage()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-8 p-4 border rounded-md bg-muted/20">
          <h3 className="text-lg font-medium">Template Details</h3>
          <div className="grid gap-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="template-description">Template Description (Optional)</Label>
            <RichTextEditor
              value={templateDescription || ''}
              onChange={setTemplateDescription}
              className="min-h-[150px]"
              placeholder="Optional: Add a description for this workflow template."
            />
            <p className="text-sm text-muted-foreground">This description will help you identify the template later.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};