import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "@/components/common/RichTextEditor";
import { useFormBuilderState } from "@/hooks/forms/useFormBuilderState";
import { useFormBuilderHandlers } from "@/hooks/forms/useFormBuilderHandlers";
import { useFormBuilderActions } from "@/hooks/forms/useFormBuilderActions";
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
    formLastEditedAt,
    lastEditedByUserName,
    isTemplate,
    hasUnsavedChanges,
    isAutoSaving,
    showSavedConfirmation,
    loading,
  } = state;

  const { handleUpdateFormDetails, handleUpdateFormStatus } = useFormBuilderActions({
    formId: formId,
    setSections: state.setSections,
    setFields: state.setFields,
    fetchData: state.fetchData,
  });

  const { triggerAutoSave } = useFormBuilderHandlers({
    state,
    performUpdateFormDetails: handleUpdateFormDetails,
    performUpdateFormStatus: handleUpdateFormStatus,
  });

  useEffect(() => {
    if (!loading) {
      triggerAutoSave();
    }
  }, [formName, formDescription, state.sections, state.fields, loading, triggerAutoSave]);

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
              {isTemplate ? "Template Builder" : "Form Builder"}: {formName}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Design your {isTemplate ? "template" : "application form"}. Current Status: <Badge variant={formStatus === 'published' ? 'default' : 'secondary'}>{formStatus.charAt(0).toUpperCase() + formStatus.slice(1)}</Badge>
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
          <h3 className="text-lg font-medium">{isTemplate ? "Template Details" : "Form Details"}</h3>
          <div className="grid gap-2">
            <Label htmlFor="form-name">{isTemplate ? "Template Name" : "Form Name"}</Label>
            <Input
              id="form-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="form-description">{isTemplate ? "Template Description" : "Form Description"} (Optional)</Label>
            <RichTextEditor
              value={formDescription || ''}
              onChange={setFormDescription}
              className="min-h-[150px]"
            />
            <p className="text-sm text-muted-foreground">This description will appear at the top of the {isTemplate ? "template" : "application form"}.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};