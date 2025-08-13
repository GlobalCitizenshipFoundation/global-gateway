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
import { ProgramStage, FormField, FormSection, ApplicationReview } from "@/types";
import { evaluateRule, shouldFieldBeDisplayed, formatResponseValue } from "@/utils/forms/formFieldUtils";
import ApplicationPdfViewer from "@/components/applications/ApplicationPdfViewer";
import DOMPurify from 'dompurify';
import { ReviewList } from "@/components/review/ReviewList";
import { ReviewForm } from "@/components/review/ReviewForm";
import { useSession } from "@/contexts/auth/SessionContext";
import { ReviewerAssignment } from "@/components/review/ReviewerAssignment";

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
  } | null;
};

type ResponseWithField = {
  value: string | null;
  form_fields: FormField | null;
}

const SubmissionDetailPage = () => {
  const { programId, submissionId } = useParams<{ programId: string, submissionId: string }>();
  const { user } = useSession();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [allResponses, setAllResponses] = useState<ResponseWithField[]>([]);
  const [allFormFieldsForLogic, setAllFormFieldsForLogic] = useState<FormField[]>([]);
  const [allFormSections, setAllFormSections] = useState<FormSection[]>([]);
  const [programStages, setProgramStages] = useState<ProgramStage[]>([]);
  const [reviews, setReviews] = useState<ApplicationReview[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmissionDetails = useCallback(async () => {
    if (!submissionId || !programId) return;
    setLoading(true);
    setError(null);

    const submissionPromise = supabase
      .from('applications')
      .select(`id, submitted_date, full_name, email, stage_id, programs(title, form_id, allow_pdf_download), program_stages(name)`)
      .eq('id', submissionId)
      .single();
    
    const reviewsPromise = supabase
      .from('application_reviews')
      .select('*, profiles(first_name, last_name, avatar_url)')
      .eq('application_id', submissionId)
      .order('created_at', { ascending: false });

    const [{ data: submissionData, error: submissionError }, { data: reviewsData, error: reviewsError }] = await Promise.all([submissionPromise, reviewsPromise]);

    if (submissionError) {
      setError(submissionError.message);
      setLoading(false);
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

    const formId = formattedSubmissionData.programs?.form_id;
    if (formId) {
      const { data: allFieldsData, error: allFieldsError } = await supabase.from('form_fields').select('*').eq('form_id', formId).order('order', { ascending: true });
      if (allFieldsError) showError("Could not load all form fields for logic evaluation.");
      else setAllFormFieldsForLogic(allFieldsData as FormField[]);

      const { data: sectionsData, error: sectionsError } = await supabase.from('form_sections').select('*').eq('form_id', formId).order('order', { ascending: true });
      if (sectionsError) showError("Could not load form sections.");
      else setAllFormSections(sectionsData || []);
    }

    const { data: responsesData, error: responsesError } = await supabase.from('application_responses').select(`value, form_fields ( * )`).eq('application_id', submissionId);
    if (responsesError) showError("Could not load application responses.");
    else if (responsesData) {
      const formattedData = responsesData.map(res => ({ ...res, form_fields: Array.isArray(res.form_fields) ? res.form_fields[0] : res.form_fields }));
      setAllResponses(formattedData as ResponseWithField[]);
    }

    const { data: stagesData, error: stagesError } = await supabase.from('program_stages').select('*').eq('program_id', programId).order('order', { ascending: true });
    if (stagesError) showError("Could not fetch program stages.");
    else setProgramStages(stagesData as ProgramStage[]);

    setLoading(false);
  }, [submissionId, programId]);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [fetchSubmissionDetails]);

  const displayedResponses = useMemo(() => {
    const currentResponsesMap: Record<string, any> = {};
    allResponses.forEach(res => {
      if (res.form_fields?.id && res.value !== null) {
        if (res.form_fields.field_type === 'checkbox') {
          try { currentResponsesMap[res.form_fields.id] = JSON.parse(res.value); } catch { currentResponsesMap[res.form_fields.id] = []; }
        } else if (res.form_fields.field_type === 'number') {
          currentResponsesMap[res.form_fields.id] = parseFloat(res.value);
        } else {
          currentResponsesMap[res.form_fields.id] = res.value;
        }
      }
    });
    return allResponses.map(res => {
      const field = res.form_fields;
      if (!field) return null;
      const wasDisplayed = shouldFieldBeDisplayed(field, currentResponsesMap, allFormFieldsForLogic);
      return { ...res, wasDisplayed };
    }).filter(Boolean) as (ResponseWithField & { wasDisplayed: boolean })[];
  }, [allResponses, allFormFieldsForLogic]);

  const handleStageUpdate = async () => {
    if (!submission || !selectedStage || submission.stage_id === selectedStage) return;
    setUpdating(true);
    const { data, error } = await supabase.from('applications').update({ stage_id: selectedStage }).eq('id', submission.id).select(`*, programs(*), program_stages(*)`).single();
    if (error) {
      showError(`Failed to update stage: ${error.message}`);
    } else {
      const updatedSubmissionData: SubmissionDetail = { ...data, programs: data.programs as any, program_stages: data.program_stages as any };
      setSubmission(updatedSubmissionData);
      showSuccess(`Application moved to "${updatedSubmissionData.program_stages?.name}" stage.`);
    }
    setUpdating(false);
  };

  const handleReviewSubmit = async (values: { score: number; notes?: string }) => {
    if (!user || !submission) return;
    setIsSubmittingReview(true);
    const { error } = await supabase.from('application_reviews').insert({
      application_id: submission.id,
      reviewer_id: user.id,
      score: values.score,
      notes: values.notes,
    });
    if (error) {
      showError(`Failed to submit review: ${error.message}`);
    } else {
      showSuccess("Review submitted successfully!");
      fetchSubmissionDetails(); // Re-fetch all data to show the new review
    }
    setIsSubmittingReview(false);
  };

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
                <CardTitle className="text-2xl">{submission?.full_name}</CardTitle>
                <CardDescription>{submission?.email}</CardDescription>
              </div>
              <Badge variant="secondary">{submission?.program_stages?.name}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Application Responses</h3>
                <dl className="space-y-4">
                  {displayedResponses.length > 0 ? (
                    displayedResponses.map((res, index) => {
                      const sanitizedDescription = res.form_fields?.description ? DOMPurify.sanitize(res.form_fields.description, { USE_PROFILES: { html: true } }) : null;
                      return (
                        <div key={index}>
                          <dt className="font-medium text-sm">{res.form_fields?.label || 'Untitled Question'}</dt>
                          {sanitizedDescription && <dd className="text-sm text-muted-foreground mt-1"><div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} className="prose max-w-none" /></dd>}
                          <dd className="text-muted-foreground whitespace-pre-wrap mt-1">{formatResponseValue(res.value, res.form_fields?.field_type || null)}</dd>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground text-sm">No responses to display for this application.</p>
                  )}
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end items-center gap-4 bg-muted/50 p-4">
            {submission?.programs?.allow_pdf_download && submission && (
              <ApplicationPdfViewer
                applicationId={submission.id}
                programTitle={submission.programs?.title || 'Application'}
                applicantFullName={submission.full_name}
                applicantEmail={submission.email}
                submittedDate={submission.submitted_date}
                currentStageName={submission.program_stages?.name || 'N/A'}
                allResponses={allResponses}
                allFormFields={allFormFieldsForLogic}
                formSections={allFormSections}
              />
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Change Stage:</span>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select a stage" /></SelectTrigger>
                <SelectContent>
                  {programStages.map(stage => (<SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStageUpdate} disabled={updating || submission?.stage_id === selectedStage}>
              {updating ? 'Updating...' : 'Update Stage'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <div className="lg:col-span-1 space-y-8">
        <ReviewerAssignment applicationId={submissionId!} />
        <ReviewForm onSubmit={handleReviewSubmit} isSubmitting={isSubmittingReview} />
        <ReviewList reviews={reviews} />
      </div>
    </div>
  );
};

export default SubmissionDetailPage;