import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Form } from "@/components/ui/form";
import { useEditApplicationForm } from "@/hooks/applications/useEditApplicationForm";
import { ApplicantInfoCard } from "@/components/applications/ApplicantInfoCard";
import ApplicationFormSections from "@/components/application/ApplicationFormSections";
import { useState } from "react";
import DOMPurify from 'dompurify';
import { useSession } from "@/contexts/auth/SessionContext";

type DynamicFormValues = Record<string, string | string[] | number | undefined | null>;

const EditApplicationPage = () => {
  const { user } = useSession();
  const { application, program, applicationForm, formSections, formFields, loading, form, displayedFormFields } = useEditApplicationForm();
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const navigate = useNavigate();

  const saveResponses = async (values: DynamicFormValues) => {
    if (!application) return false;

    await supabase.from('application_responses').delete().eq('application_id', application.id);

    const responseRecords = displayedFormFields
      .map(field => {
        const fieldValue = values[field.id];
        if (fieldValue === undefined || fieldValue === null || (typeof fieldValue === 'string' && fieldValue.trim() === '')) return null;
        const valueToStore = field.field_type === 'checkbox' ? JSON.stringify(fieldValue) : String(fieldValue);
        return { application_id: application.id, field_id: field.id, value: valueToStore };
      })
      .filter(Boolean);

    if (responseRecords.length > 0) {
      const { error: insertError } = await supabase.from('application_responses').insert(responseRecords as any);
      if (insertError) {
        showError(`Failed to save responses: ${insertError.message}`);
        return false;
      }
    }
    return true;
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    const values = form.getValues();
    const responsesSaved = await saveResponses(values);

    if (responsesSaved) {
      const { error } = await supabase
        .from('applications')
        .update({ stage_status: 'In Progress', last_saved_at: new Date().toISOString() })
        .eq('id', application!.id);
      
      if (error) showError(`Failed to save draft status: ${error.message}`);
      else showSuccess("Draft saved successfully!");
    }
    setSavingDraft(false);
  };

  const onSubmit = async (values: DynamicFormValues) => {
    if (!user || !application || !program) {
      showError("Cannot submit: required data is missing.");
      return;
    }
    setSubmitting(true);

    const responsesSaved = await saveResponses(values);
    if (!responsesSaved) {
      setSubmitting(false);
      return;
    }

    const { error: updateAppError } = await supabase
      .from('applications')
      .update({ submitted_date: new Date().toISOString(), stage_status: 'Completed' })
      .eq('id', application.id);

    if (updateAppError) {
      showError(`Failed to update submission status: ${updateAppError.message}`);
    } else {
      showSuccess("Application resubmitted successfully!");
      navigate('/dashboard');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="container py-12">
        <Card className="mx-auto max-w-2xl">
          <CardHeader><Skeleton className="h-8 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="grid gap-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!program || !applicationForm) return null;

  const sanitizedDescription = applicationForm.description ? DOMPurify.sanitize(applicationForm.description, { USE_PROFILES: { html: true } }) : null;

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Submission for: {program.title}</CardTitle>
          {applicationForm.description && (
            <CardDescription>
              <div dangerouslySetInnerHTML={{ __html: sanitizedDescription || '' }} className="prose max-w-none" />
            </CardDescription>
          )}
          <CardDescription>Update your information below and resubmit.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <ApplicantInfoCard fullName={application?.full_name || ''} email={application?.email || ''} />
              <ApplicationFormSections
                formSections={formSections}
                displayedFormFields={displayedFormFields}
                submitting={submitting || savingDraft}
              />
              <div className="flex justify-between items-center">
                <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={submitting || savingDraft}>
                  {savingDraft ? 'Saving Draft...' : 'Save Draft'}
                </Button>
                <Button type="submit" disabled={submitting || savingDraft}>
                  {submitting ? 'Resubmitting...' : 'Save & Resubmit Application'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditApplicationPage;