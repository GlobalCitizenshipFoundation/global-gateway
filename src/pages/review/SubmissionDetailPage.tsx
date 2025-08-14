import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { ProgramStage, FormField, FormSection, ApplicationReview, EvaluationCriterion } from "@/types";
import { shouldFieldBeDisplayed, formatResponseValue } from "@/utils/forms/formFieldUtils";
import ApplicationPdfViewer from "@/components/applications/ApplicationPdfViewer";
import DOMPurify from 'dompurify';
import { ReviewList } from "@/components/review/ReviewList";
import { ReviewForm } from "@/components/review/ReviewForm";
import { useSession } from "@/contexts/auth/SessionContext";
import { ReviewerAssignment } from "@/components/review/ReviewerAssignment";
import { YourReviewCard } from "@/components/review/YourReviewCard";
import { DynamicReviewForm } from "@/components/review/DynamicReviewForm";
import { useFormLoader, DynamicFormValues } from "@/hooks/forms/useFormLoader";
import { Form } from "@/components/ui/form"; // Added import
import ApplicationFormSections from "@/components/application/ApplicationFormSections"; // Added import

type SubmissionDetail = {
  id: string;
  submitted_date: string;
  full_name: string;
  email: string;
  stage_id: string;
  programs: {
    title: string;
    form_id: string | null;
    allow_pdf_download: boolean;
  } | null;
  program_stages: {
    name: string;
    evaluation_template_id: string | null;
    description: string | null;
    step_type: ProgramStage['step_type'];
  } | null;
};

type ResponseWithField = {
  value: string | null;
  form_fields: FormField | null;
}

const SubmissionDetailPage = () => {
  const { programId, submissionId } = useParams<{ programId: string, submissionId: string }>();
  const { user, profile } = useSession();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [reviews, setReviews] = useState<ApplicationReview[]>([]);
  const [evaluationCriteria, setEvaluationCriteria] = useState<EvaluationCriterion[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [loadingPage, setLoadingPage] = useState(true); // Overall page loading
  const [updating, setUpdating] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialResponses, setInitialResponses] = useState<DynamicFormValues>({});
  const [targetFormIdForResponses, setTargetFormIdForResponses] = useState<string | undefined>(undefined);

  // Use the new form loader hook for application responses
  const {
    program: loadedProgram, // Renamed to avoid conflict with local 'program' state
    applicationForm,
    formSections,
    formFields, // All form fields for logic evaluation
    loading: formLoaderLoading,
    error: formLoaderError,
    form: formLoaderInstance, // Renamed to avoid conflict with local 'form' state
    currentResponses: formLoaderCurrentResponses,
    displayedFormFields: formLoaderDisplayedFormFields, // Fields displayed after their own logic
  } = useFormLoader({ programId, formId: targetFormIdForResponses, initialResponses });

  const [stages, setStages] = useState<ProgramStage[]>([]); // Define stages state here

  const fetchSubmissionDetails = useCallback(async () => {
    if (!submissionId || !programId) {
      setLoadingPage(false);
      return;
    }
    setLoadingPage(true);
    setError(null);

    const submissionPromise = supabase
      .from('applications')
      .select(`id, submitted_date, full_name, email, stage_id, programs(title, form_id, allow_pdf_download), program_stages(name, evaluation_template_id, description, step_type)`)
      .eq('id', submissionId)
      .single();
    
    const reviewsPromise = supabase
      .from('application_reviews')
      .select('*, profiles(first_name, last_name, avatar_url), review_scores(*, evaluation_criteria(label, criterion_type))')
      .eq('application_id', submissionId)
      .order('created_at', { ascending: false });

    const responsesPromise = supabase
      .from('application_responses')
      .select(`value, form_fields ( id, label, field_type, options, is_required, order, display_rules, description, tooltip )`)
      .eq('application_id', submissionId);

    const stagesPromise = supabase.from('program_stages').select('*').eq('program_id', programId).order('order', { ascending: true });

    const [{ data: submissionData, error: submissionError }, { data: reviewsData, error: reviewsError }, { data: responsesData, error: responsesError }, { data: stagesData, error: stagesError }] = await Promise.all([submissionPromise, reviewsPromise, responsesPromise, stagesPromise]);

    if (submissionError) {
      setError(submissionError.message);
      setLoadingPage(false);
      return;
    }
    const formattedSubmissionData: SubmissionDetail = {
      ...submissionData,
      programs: submissionData.programs as unknown as SubmissionDetail['programs'],
      program_stages: submissionData.program_stages as unknown as SubmissionDetail['program_stages'],
    };
    setSubmission(formattedSubmissionData);
    setSelectedStage(formattedSubmissionData.stage_id);

    if (reviewsError) {
      showError("Could not load reviews.");
    } else {
      setReviews(reviewsData as ApplicationReview[]);
    }

    if (formattedSubmissionData.program_stages?.evaluation_template_id) {
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('evaluation_criteria')
        .select('*')
        .eq('template_id', formattedSubmissionData.program_stages.evaluation_template_id)
        .order('order', { ascending: true });
      if (criteriaError) showError("Could not load evaluation criteria.");
      else setEvaluationCriteria(criteriaData as EvaluationCriterion[]);
    } else {
      setEvaluationCriteria([]);
    }

    // Set the stages state here
    if (stagesError) {
      showError("Could not load program stages.");
    } else {
      setStages(stagesData || []);
    }

    // Determine which form to load for responses based on stage type
    let formIdForLoader: string | null = formattedSubmissionData.programs?.form_id || null;
    if (formattedSubmissionData.program_stages?.step_type === 'review' && formattedSubmissionData.program_stages.description) {
      try {
        const config = JSON.parse(formattedSubmissionData.program_stages.description);
        const reviewFormSourceStageOrder = config.review_form_source_stage_order;
        if (typeof reviewFormSourceStageOrder === 'number') {
          const sourceStage = (stagesData as ProgramStage[]).find(s => s.order === reviewFormSourceStageOrder);
          if (sourceStage) {
            formIdForLoader = sourceStage.form_id;
          }
        }
      } catch (e) {
        console.error("Error parsing review stage description:", e);
        showError("Invalid review stage configuration.");
        formIdForLoader = null;
      }
    }
    setTargetFormIdForResponses(formIdForLoader || undefined);

    if (responsesError) {
      showError("Could not load application responses.");
    } else if (responsesData) {
      const initialValues: DynamicFormValues = {};
      responsesData.forEach(res => {
        const field = Array.isArray(res.form_fields) ? res.form_fields[0] : res.form_fields;
        if (field && res.value !== null) {
          if (field.field_type === 'checkbox') {
            try { initialValues[field.id] = JSON.parse(res.value); } catch { initialValues[field.id] = []; }
          } else if (field.field_type === 'number' || field.field_type === 'rating') {
            initialValues[field.id] = parseFloat(res.value);
          } else {
            initialValues[field.id] = res.value;
          }
        }
      });
      formLoaderInstance.reset(initialValues); // Use formLoaderInstance to reset the form
      setInitialResponses(initialValues);
    }
    
    setLoadingPage(false);
  }, [programId, submissionId, formLoaderInstance]); // Added formLoaderInstance to dependencies

  useEffect(() => {
    fetchSubmissionDetails();
  }, [fetchSubmissionDetails]);

  const isReviewer = useMemo(() => profile?.role === 'reviewer', [profile]);
  const isIdentityAnonymized = useMemo(() => {
    if (!isReviewer || !submission?.program_stages?.description) return false;
    try {
      const config = JSON.parse(submission.program_stages.description);
      return !!config.anonymize_identity;
    } catch {
      return false;
    }
  }, [isReviewer, submission]);

  const displayedResponsesForPdf = useMemo(() => {
    // Use formLoaderDisplayedFormFields which already applies conditional logic
    // and filter by anonymization status if current user is a reviewer
    return formLoaderDisplayedFormFields.filter(field => {
      if (isReviewer && field.is_anonymized) return false;
      return true;
    }).map(field => {
      // Find the corresponding value from formLoaderCurrentResponses
      const value = formLoaderCurrentResponses[field.id];
      return { form_fields: field, value: value !== undefined && value !== null ? String(value) : null };
    });
  }, [formLoaderDisplayedFormFields, formLoaderCurrentResponses, isReviewer]);

  const handleStageUpdate = async () => {
    if (!submission || !selectedStage || submission.stage_id === selectedStage) return;
    setUpdating(true);

    // Use the local stages state, not loadedProgram.program_stages
    const newStage = stages.find((s: ProgramStage) => s.id === selectedStage); 
    let newStageStatus = 'Completed';
    if (newStage?.step_type === 'resubmission') {
      newStageStatus = 'Awaiting Resubmission';
    } else if (newStage?.step_type === 'form') {
      newStageStatus = 'Not Submitted';
    }

    const { data, error } = await supabase.from('applications').update({ stage_id: selectedStage, stage_status: newStageStatus }).eq('id', submission.id).select(`*, programs(*), program_stages(*)`).single();
    if (error) {
      showError(`Failed to update stage: ${error.message}`);
    } else {
      const updatedSubmissionData: SubmissionDetail = { ...data, programs: data.programs as any, program_stages: data.program_stages as any };
      setSubmission(updatedSubmissionData);
      showSuccess(`Application moved to "${updatedSubmissionData.program_stages?.name}" stage.`);
    }
    setUpdating(false);
  };

  const handleReviewSubmit = async (values: Record<string, any>) => {
    if (!user || !submission) return;
    setIsSubmittingReview(true);

    const scores = evaluationCriteria.map(criterion => ({
      criterion_id: criterion.id,
      value: String(values[criterion.id]),
    }));

    const { error } = await supabase.rpc('submit_review_with_scores', {
      p_application_id: submission.id,
      p_program_stage_id: submission.stage_id,
      p_evaluation_template_id: submission.program_stages?.evaluation_template_id,
      p_overall_score: values.overall_score,
      p_internal_notes: values.internal_notes,
      p_shared_feedback: values.shared_feedback,
      p_scores: scores,
    });

    if (error) {
      showError(`Failed to submit review: ${error.message}`);
    } else {
      showSuccess("Review submitted successfully!");
      fetchSubmissionDetails();
    }
    setIsSubmittingReview(false);
  };

  const userReview = useMemo(() => {
    if (!user || !reviews) return null;
    return reviews.find(r => r.reviewer_id === user.id) || null;
  }, [reviews, user]);

  const isManager = useMemo(() => {
    return profile && ['creator', 'admin', 'super_admin'].includes(profile.role);
  }, [profile]);

  const loading = loadingPage || formLoaderLoading;

  if (loading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-6 w-48 mb-4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="w-1/3">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !submission) {
    return <div className="container py-12 text-center text-destructive">Error: {error || "Submission not found."}</div>;
  }

  return (
    <div className="container py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Link to={`/creator/program/${programId}/submissions`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Link>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{isIdentityAnonymized ? '[Anonymized Applicant]' : submission?.full_name}</CardTitle>
                <CardDescription>{isIdentityAnonymized ? '[Anonymized Email]' : submission?.email}</CardDescription>
              </div>
              <Badge variant="secondary">{submission?.program_stages?.name}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Application Responses</h3>
                {/* Render ApplicationFormSections here */}
                {applicationForm && (
                  <Form {...formLoaderInstance}>
                    <form>
                      <ApplicationFormSections
                        formSections={formSections}
                        displayedFormFields={formLoaderDisplayedFormFields}
                        allFormFields={formFields}
                        currentResponses={formLoaderCurrentResponses}
                        submitting={false}
                      />
                    </form>
                  </Form>
                )}
              </div>
            </div>
          </CardContent>
          {isManager && (
            <CardFooter className="flex justify-end items-center gap-4 bg-muted/50 p-4">
              {submission?.programs?.allow_pdf_download && submission && (
                <ApplicationPdfViewer
                  applicationId={submission.id}
                  programTitle={submission.programs?.title || 'Application'}
                  applicantFullName={submission.full_name || 'Applicant'}
                  applicantEmail={submission.email || 'N/A'}
                  submittedDate={submission.submitted_date}
                  currentStageName={submission.program_stages?.name || 'N/A'}
                  allResponses={displayedResponsesForPdf} // Pass filtered responses for PDF
                  allFormFields={formFields} // Pass all fields for logic evaluation in PDF
                  formSections={formSections}
                />
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Change Stage:</span>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select a stage" /></SelectTrigger>
                  <SelectContent>
                    {stages.map((stage: ProgramStage) => (<SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStageUpdate} disabled={updating || submission?.stage_id === selectedStage}>
                {updating ? 'Updating...' : 'Update Stage'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-8">
        {isManager && <ReviewerAssignment applicationId={submissionId!} />}
        
        {userReview ? (
          <YourReviewCard review={userReview} />
        ) : evaluationCriteria.length > 0 ? (
          <DynamicReviewForm criteria={evaluationCriteria} onSubmit={handleReviewSubmit} isSubmitting={isSubmittingReview} />
        ) : (
          <ReviewForm onSubmit={async (values) => handleReviewSubmit({ ...values, internal_notes: values.notes })} isSubmitting={isSubmittingReview} />
        )}

        {isManager && <ReviewList reviews={reviews} />}
      </div>
    </div>
  );
};

export default SubmissionDetailPage;