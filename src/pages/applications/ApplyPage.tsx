import { useNavigate } from "react-router-dom";
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
import { useApplicationForm } from "@/hooks/applications/useApplicationForm";
import { ApplicantInfoCard } from "@/components/applications/ApplicantInfoCard";
import ApplicationFormSections from "@/components/application/ApplicationFormSections";
import { useState, useEffect } from "react";
import DOMPurify from 'dompurify';

type DynamicFormValues = Record<string, string | string[] | number | undefined | null>;

const ApplyPage = () => {
  const {
    program,
    formSections,
    formFields, // All form fields for logic evaluation
    loading,
    profileFullName,
    profileEmail,
    form,
    displayedFormFields, // Fields displayed after their own logic
    user,
    programId,
    applicationForm,
    currentResponses, // Current responses for section logic
  } = useApplicationForm();

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && program && applicationForm && applicationForm.status !== 'published') {
      showError("This application form is not currently published and cannot be accessed.");
      navigate(`/programs/${programId}`);
    }
  }, [loading, program, applicationForm, navigate, programId]);


  const onSubmit = async (values: DynamicFormValues) => {
    if (!user || !program || !applicationForm || applicationForm.status !== 'published') {
      showError("Cannot submit: form is not published or data is missing.");
      return;
    }
    setSubmitting(true);

    const { data: firstStage, error: stageError } = await supabase.from('program_stages').select('id').eq('program_id', program.id).order('order', { ascending: true }).limit(1).single();
    if (stageError || !firstStage) {
      showError(`Could not find starting stage for this program. ${stageError?.message || ''}`);
      setSubmitting(false);
      return;
    }

    // Explicitly type appData to avoid 'never' inference
    const { data: appData, error: appError } = await supabase.from('applications').insert({
      program_id: program.id,
      user_id: user.id,
      full_name: profileFullName,
      email: profileEmail,
      stage_id: firstStage.id,
    }).select('id').single() as { data: { id: string } | null, error: any }; // Cast to expected type

    if (appError || !appData) {
      showError(`Submission failed: ${appData?.id ? 'Failed to save responses.' : appError.message}`);
      if (appData?.id) {
        await supabase.from('applications').delete().eq('id', appData.id);
      }
      setSubmitting(false);
      return;
    }

    const responseRecords: { application_id: string; field_id: string; value: string; }[] = [];

    for (const field of displayedFormFields) {
      const fieldValue = values[field.id];
      const valueToStore = field.field_type === 'checkbox' ? JSON.stringify(fieldValue) :
                           (field.field_type === 'number' && fieldValue === undefined) ? '' : String(fieldValue);

      if (fieldValue !== undefined && fieldValue !== null && valueToStore !== '') {
        responseRecords.push({
          application_id: appData.id,
          field_id: field.id,
          value: valueToStore,
        });
      }
    }

    const { error: responsesError } = await supabase.from('application_responses').insert(responseRecords);
    if (responsesError) {
      showError(`Failed to save form responses: ${responsesError.message}`);
      await supabase.from('applications').delete().eq('id', appData.id);
    } else {
      showSuccess("Application submitted successfully!");
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

  if (!program || !applicationForm || applicationForm.status !== 'published') {
    return null;
  }

  const sanitizedDescription = applicationForm.description ? DOMPurify.sanitize(applicationForm.description, { USE_PROFILES: { html: true } }) : null;

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Apply for: {program.title}</CardTitle>
          {applicationForm.description && (
            <CardDescription>
              <div dangerouslySetInnerHTML={{ __html: sanitizedDescription || '' }} className="prose max-w-none" />
            </CardDescription>
          )}
          <CardDescription>Your name and email are automatically included. Please fill out the custom fields below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              <ApplicantInfoCard fullName={profileFullName} email={profileEmail} />

              <ApplicationFormSections
                formSections={formSections}
                displayedFormFields={displayedFormFields}
                allFormFields={formFields} // Pass all fields for section logic
                currentResponses={currentResponses} // Pass current responses for section logic
                submitting={submitting}
              />

              <Button type="submit" className="w-full" disabled={submitting || formFields.length === 0}>
                {submitting ? 'Submitting...' : (program.submission_button_text || 'Submit Application')}
              </Button>
              {formFields.length === 0 && (<p className="text-sm text-center text-muted-foreground">This program does not have any application fields yet.</p>)}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyPage;