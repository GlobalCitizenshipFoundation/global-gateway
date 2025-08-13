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
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { ProgramStage, FormField, FormSection, EmailTemplate } from "@/types"; // Import EmailTemplate
import { evaluateRule, shouldFieldBeDisplayed, formatResponseValue } from "@/utils/formFieldUtils";
import ApplicationPdfViewer from "@/components/application/ApplicationPdfViewer"; // Import the new component
import DOMPurify from 'dompurify'; // Import DOMPurify
import { sendEmailTemplate } from "@/utils/emailSender"; // Import sendEmailTemplate

type SubmissionDetail = {
  id: string;
  submitted_date: string;
  full_name: string;
  email: string;
  stage_id: string;
  programs: { // Corrected type definition
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
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [allResponses, setAllResponses] = useState<ResponseWithField[]>([]);
  const [allFormFieldsForLogic, setAllFormFieldsForLogic] = useState<FormField[]>([]); // Store all fields for logic evaluation
  const [allFormSections, setAllFormSections] = useState<FormSection[]>([]); // State to hold all form sections
  const [programStages, setProgramStages] = useState<ProgramStage[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]); // State to hold email templates
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!submissionId || !programId) return;
      setLoading(true);
      setError(null);

      // Fetch submission and program's form_id
      const { data: submissionData, error: submissionError } = await supabase
        .from('applications')
        .select(`id, submitted_date, full_name, email, stage_id, programs(title, form_id, allow_pdf_download), program_stages(name)`)
        .eq('id', submissionId)
        .single();

      if (submissionError) {
        setError(submissionError.message);
        setLoading(false);
        return;
      }
      const formattedSubmissionData: SubmissionDetail = {
        ...submissionData,
        programs: submissionData.programs, // Simplified assignment
        program_stages: submissionData.program_stages, // Simplified assignment
      };
      setSubmission(formattedSubmissionData);
      setSelectedStage(formattedSubmissionData.stage_id);

      const formId = formattedSubmissionData.programs?.form_id;

      // Fetch all form fields for the program's form (needed for display logic evaluation)
      if (formId) {
        const { data: allFieldsData, error: allFieldsError } = await supabase
          .from('form_fields')
          .select('id, form_id, section_id, label, field_type, options, is_required, order, display_rules, description, tooltip, placeholder, last_edited_by_user_id, last_edited_at') // Explicitly select columns
          .eq('form_id', formId)
          .order('order', { ascending: true });

        if (allFieldsError) {
          showError("Could not load all form fields for logic evaluation.");
        } else {
          setAllFormFieldsForLogic(allFieldsData as FormField[]);
        }

        // Fetch all form sections for the program's form
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('form_sections')
          .select('*, description, tooltip') // Select new columns
          .eq('form_id', formId)
          .order('order', { ascending: true });

        if (sectionsError) {
          showError("Could not load form sections.");
        } else {
          setAllFormSections(sectionsData || []);
        }
      }

      // Fetch responses with full form_fields data
      const { data: responsesData, error: responsesError } = await supabase
        .from('application_responses')
        .select(`value, form_fields ( id, label, field_type, options, is_required, order, display_rules, description, tooltip, placeholder )`) // Explicitly select columns
        .eq('application_id', submissionId);
      
      if (responsesError) {
        showError("Could not load application responses.");
      } else if (responsesData) {
        const formattedData = responsesData.map(res => ({
          ...res,
          form_fields: Array.isArray(res.form_fields) ? res.form_fields[0] : res.form_fields
        }));
        setAllResponses(formattedData as ResponseWithField[]);
      }

      // Fetch all possible stages for the program
      const { data: stagesData, error: stagesError } = await supabase
        .from('program_stages')
        .select('id, name, order, program_id, created_at, email_template_id') // Added email_template_id
        .eq('program_id', programId)
        .order('order', { ascending: true });
      
      if (stagesError) {
        showError("Could not fetch program stages.");
      } else {
        setProgramStages(stagesData as ProgramStage[]);
      }

      // Fetch all published email templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('status', 'published'); // Only fetch published templates

      if (templatesError) {
        showError("Could not fetch email templates.");
      } else {
        setEmailTemplates(templatesData as EmailTemplate[]);
      }

      setLoading(false);
    };

    fetchSubmissionDetails();
  }, [submissionId, programId]);

  // Memoize the filtered responses to avoid re-calculation on every render
  const displayedResponses = useMemo(() => {
    const currentResponsesMap: Record<string, any> = {};
    allResponses.forEach(res => {
      if (res.form_fields?.id && res.value !== null) {
        // For checkbox, parse the JSON string back to an array for logic evaluation
        if (res.form_fields.field_type === 'checkbox') {
          try {
            currentResponsesMap[res.form_fields.id] = JSON.parse(res.value);
          } catch {
            currentResponsesMap[res.form_fields.id] = [];
          }
        } else if (res.form_fields.field_type === 'number') {
          currentResponsesMap[res.form_fields.id] = parseFloat(res.value);
        }
        else {
          currentResponsesMap[res.form_fields.id] = res.value;
        }
      }
    });

    // Use allFormFieldsForLogic for shouldFieldBeDisplayed to ensure all fields are considered
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
    const { data, error } = await supabase
      .from('applications')
      .update({ stage_id: selectedStage })
      .eq('id', submission.id)
      .select(`id, submitted_date, full_name, email, stage_id, programs(title, form_id, allow_pdf_download), program_stages(name)`) // Select necessary fields for email
      .single();

    if (error) {
      showError(`Failed to update stage: ${error.message}`);
    } else {
      const updatedSubmissionData: SubmissionDetail = {
        ...data,
        programs: data.programs, // Simplified assignment
        program_stages: data.program_stages, // Simplified assignment
      };
      setSubmission(updatedSubmissionData);
      showSuccess(`Application moved to "${updatedSubmissionData.program_stages?.name}" stage.`);

      // Send email if a template is associated with the new stage
      const newStage = programStages.find(s => s.id === selectedStage);
      if (newStage?.email_template_id && updatedSubmissionData.email) {
        const template = emailTemplates.find(t => t.id === newStage.email_template_id);
        if (template) {
          await sendEmailTemplate(template.name, updatedSubmissionData.email, {
            applicant_name: updatedSubmissionData.full_name || 'Applicant',
            program_title: updatedSubmissionData.programs?.title || 'Program',
            new_stage_name: newStage.name,
          });
        } else {
          console.warn(`Email template with ID ${newStage.email_template_id} not found for sending.`);
        }
      }
    }
    setUpdating(false);
  };

  return (
    <div className="container py-12">
      <Link to={`/creator/program/${programId}/submissions`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Submissions
      </Link>
      <Card className="mx-auto max-w-2xl">
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
                        <dt className="font-medium text-sm">
                          {res.form_fields?.label || 'Untitled Question'}
                          {!res.wasDisplayed && (
                            <span className="ml-2 text-xs text-muted-foreground italic">(Hidden by logic)</span>
                          )}
                        </dt>
                        {sanitizedDescription && ( // Display description
                          <dd className="text-sm text-muted-foreground mt-1"><div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} className="prose max-w-none" /></dd>
                        )}
                        {res.form_fields?.tooltip && (
                          <dd className="text-xs text-muted-foreground mt-1">Tooltip: {res.form_fields.tooltip}</dd>
                        )}
                        <dd className="text-muted-foreground whitespace-pre-wrap mt-1">{formatResponseValue(res.value, res.form_fields?.field_type)}</dd>
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
          {submission?.programs?.allow_pdf_download && (
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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {programStages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleStageUpdate} disabled={updating || submission?.stage_id === selectedStage}>
            {updating ? 'Updating...' : 'Update Stage'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubmissionDetailPage;