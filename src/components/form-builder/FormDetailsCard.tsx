import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "@/components/RichTextEditor";
import { useFormBuilderState } from "@/hooks/useFormBuilderState"; // Import the state hook
import { useFormBuilderHandlers } from "@/hooks/useFormBuilderHandlers"; // Import handlers hook
import { useFormBuilderActions } from "@/hooks/useFormBuilderActions"; // Import actions hook
import { useEffect } from "react";

interface FormDetailsCardProps {
  state: ReturnType<typeof useFormBuilderState>;
}

export const FormDetailsCard = ({ state }: FormDetailsCardProps) => {
  const {
    formId,
    formName, setFormName,
    formDescription, setFormDescription,
    formStatus,
    formLastEditedAt, // Use this for the "Last updated" timestamp
    lastEditedByUserName,
    hasUnsavedChanges,
    isAutoSaving,
    showSavedConfirmation, // New: for "Saved!" message
    loading,
  } = state;

  // We need to pass the actions to the handlers hook
  const { handleUpdateFormDetails, handleUpdateFormStatus } = useFormBuilderActions({
    formId: formId,
    setSections: state.setSections, // Pass setters from state
    setFields: state.setFields,     // Pass setters from state
    fetchData: state.fetchData,     // Pass fetchData from state
  });

  const { triggerAutoSave } = useFormBuilderHandlers({
    state,
    performUpdateFormDetails: handleUpdateFormDetails,
    performUpdateFormStatus: handleUpdateFormStatus,
  });

  // Effect to trigger auto-save on relevant state changes
  useEffect(() => {
    if (!loading) { // Only auto-save after initial load
      triggerAutoSave();
    }
    // The cleanup for the timeout is handled within triggerAutoSave's useCallback and useRef
  }, [formName, formDescription, state.sections, state.fields, loading, triggerAutoSave]); // Depend on sections and fields to trigger auto-save on their changes

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
    return null; // No dynamic status to show
  };

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Form Builder: {formName}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Design your application form. Current Status: <Badge variant={formStatus === 'published' ? 'default' : 'secondary'}>{formStatus.charAt(0).toUpperCase() + formStatus.slice(1)}</Badge>
            </div>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            {formLastEditedAt && (
              <p>Last updated: {new Date(formLastEditedAt).toLocaleString()}</p>
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
          <h3 className="text-lg font-medium">Form Details</h3>
          <div className="grid gap-2">
            <Label htmlFor="form-name">Form Name</Label>
            <Input
              id="form-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="form-description">Form Description (Optional)</Label>
            <RichTextEditor
              value={formDescription || ''}
              onChange={setFormDescription}
              className="min-h-[150px]"
            />
            <p className="text-sm text-muted-foreground">This description will appear at the top of the application form.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};