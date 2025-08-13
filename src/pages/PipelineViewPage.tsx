import { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { FormField, ProgramStage, EmailTemplate } from "@/types"; // Import EmailTemplate
import { Applicant, ApplicantCard } from "@/components/ApplicantCard";
import { KanbanColumn } from "@/components/KanbanColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shouldFieldBeDisplayed, formatResponseValue } from "@/utils/formFieldUtils";
import DOMPurify from 'dompurify'; // Import DOMPurify
import { sendEmailTemplate } from "@/utils/emailSender"; // Import sendEmailTemplate
import { useEmailTemplatesData } from "@/hooks/useEmailTemplatesData"; // Import useEmailTemplatesData

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
  program_stages: { name: string } | null;
};

type ResponseWithField = {
  value: string | null;
  form_fields: FormField | null;
};

const PipelineViewPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [programTitle, setProgramTitle] = useState("");
  const [programFormId, setProgramFormId] = useState<string | null>(null); // New state for form_id
  const [stages, setStages] = useState<ProgramStage[]>([]);
  const [applications, setApplications] = useState<Applicant[]>([]);
  const [activeApplicant, setActiveApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);
  const [allSubmissionResponses, setAllSubmissionResponses] = useState<ResponseWithField[]>([]);
  const [allFormFieldsForLogic, setAllFormFieldsForLogic] = useState<FormField[]>([]); // Store all fields for logic evaluation
  const [sheetLoading, setSheetLoading] = useState(false);
  const [currentStageInSheet, setCurrentStageInSheet] = useState('');

  const { emailTemplates } = useEmailTemplatesData(); // Fetch emailTemplates

  useEffect(() => {
    const fetchData = async () => {
      if (!programId) return;
      setLoading(true);

      const programPromise = supabase.from("programs").select("title, form_id").eq("id", programId).single(); // Fetch form_id
      const stagesPromise = supabase.from("program_stages").select("id, name, order, email_template_id").eq("program_id", programId).order("order", { ascending: true }); // Fetch email_template_id
      const applicationsPromise = supabase.from("applications").select("id, full_name, email, stage_id").eq("program_id", programId); // Fetch email for sending

      const [
        { data: programData, error: programError },
        { data: stagesData, error: stagesError },
        { data: applicationsData, error: applicationsError },
      ] = await Promise.all([programPromise, stagesPromise, applicationsPromise]);

      if (programError || stagesError || applicationsError) {
        showError("Failed to load pipeline data.");
      } else {
        setProgramTitle(programData.title);
        setProgramFormId(programData.form_id); // Set form_id
        setStages(stagesData as ProgramStage[]);
        setApplications(applicationsData as Applicant[]);

        // Fetch all form fields for the program's form (needed for display logic evaluation)
        if (programData.form_id) {
          const { data: allFieldsData, error: allFieldsError } = await supabase
            .from('form_fields')
            .select('id, form_id, section_id, label, field_type, options, is_required, order, display_rules, description, tooltip, placeholder, last_edited_by_user_id, last_edited_at') // Explicitly select columns
            .eq('form_id', programData.form_id)
            .order('order', { ascending: true });

          if (allFieldsError) {
            showError("Could not load all form fields for logic evaluation.");
          } else {
            setAllFormFieldsForLogic(allFieldsData as FormField[]);
          }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [programId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Applicant") {
      setActiveApplicant(event.active.data.current.applicant);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveApplicant(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeIsApplicant = active.data.current?.type === "Applicant";
    const overIsColumn = over.data.current?.type === "Column";

    if (activeIsApplicant && overIsColumn && active.data.current?.applicant.stage_id !== overId) {
      const applicantId = activeId as string;
      const newStageId = overId as string;
      const applicantEmail = active.data.current?.applicant.email; // Get applicant email from drag data

      const originalApplications = [...applications];
      setApplications((apps) =>
        apps.map((app) => (app.id === applicantId ? { ...app, stage_id: newStageId } : app))
      );

      const { error } = await supabase.from("applications").update({ stage_id: newStageId }).eq("id", applicantId);

      if (error) {
        showError("Failed to move applicant. Reverting.");
        setApplications(originalApplications);
      } else {
        showSuccess("Applicant moved successfully.");
        
        // Find the new stage and its associated email template
        const newStage = stages.find(s => s.id === newStageId);
        if (newStage?.email_template_id && applicantEmail) {
          const template = emailTemplates.find(t => t.id === newStage.email_template_id);
          if (template) {
            await sendEmailTemplate(template.name, applicantEmail, {
              applicant_name: active.data.current?.applicant.full_name || 'Applicant',
              program_title: programTitle,
              new_stage_name: newStage.name,
            });
          } else {
            console.warn(`Email template with ID ${newStage.email_template_id} not found for sending.`);
          }
        }
      }
    }
  };

  // Memoize the filtered responses for the sheet
  const displayedSubmissionResponses = useMemo(() => {
    const currentResponsesMap: Record<string, any> = {};
    allSubmissionResponses.forEach(res => {
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
    return allSubmissionResponses.map(res => {
      const field = res.form_fields;
      if (!field) return null;

      const wasDisplayed = shouldFieldBeDisplayed(field, currentResponsesMap, allFormFieldsForLogic);
      return { ...res, wasDisplayed };
    }).filter(Boolean) as (ResponseWithField & { wasDisplayed: boolean })[];
  }, [allSubmissionResponses, allFormFieldsForLogic]);

  const handleApplicantClick = async (applicant: Applicant) => {
    setIsSheetOpen(true);
    setSheetLoading(true);
    setSelectedSubmission(null);
    setAllSubmissionResponses([]);

    const { data: submissionData, error: submissionError } = await supabase
      .from('applications').select(`id, submitted_date, full_name, email, stage_id, programs(title, form_id, allow_pdf_download), program_stages(name)`).eq('id', applicant.id).single();

    if (submissionError) {
      showError("Failed to load submission details.");
      setIsSheetOpen(false);
      setSheetLoading(false);
      return;
    }
    const formattedSubmissionData: SubmissionDetail = {
      ...submissionData,
      programs: submissionData.programs, // Simplified assignment
      program_stages: submissionData.program_stages, // Simplified assignment
    };
    setSelectedSubmission(formattedSubmissionData);
    setCurrentStageInSheet(formattedSubmissionData.stage_id);

    // Fetch responses with full form_fields data including display_rules, description, tooltip
    const { data: responsesData, error: responsesError } = await supabase
      .from('application_responses').select(`value, form_fields ( id, label, field_type, options, is_required, order, display_rules, description, tooltip, placeholder )`).eq('application_id', applicant.id); // Explicitly select columns
    
    if (responsesError) {
      showError("Could not load application responses.");
    } else if (responsesData) {
      const formattedData = responsesData.map(res => ({
        ...res,
        form_fields: Array.isArray(res.form_fields) ? res.form_fields[0] : res.form_fields
      }));
      setAllSubmissionResponses(formattedData as ResponseWithField[]);
    }
    
    setSheetLoading(false);
  };

  const handleStageUpdateInSheet = async () => {
    if (!selectedSubmission || selectedSubmission.stage_id === currentStageInSheet) return;
    
    setSheetLoading(true);
    const { data, error } = await supabase
      .from('applications').update({ stage_id: currentStageInSheet }).eq('id', selectedSubmission.id)
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
      setApplications(apps => apps.map(app => app.id === selectedSubmission.id ? { ...app, stage_id: currentStageInSheet } : app));
      showSuccess(`Application moved to a new stage.`);
      setIsSheetOpen(false);

      // Send email if a template is associated with the new stage
      const newStage = stages.find(s => s.id === currentStageInSheet);
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
    setSheetLoading(false);
  };

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-4">
        <Link to={`/creator/program/${programId}/submissions`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Link>
        {programFormId && (
          <Button asChild variant="outline">
            <Link to={`/creator/forms/${programFormId}/edit`}>Manage Form</Link>
          </Button>
        )}
      </div>
      <h1 className="text-3xl font-bold mb-8">Pipeline for: {programTitle}</h1>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={stages.map((s) => s.id)}>
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                applicants={applications.filter((app) => app.stage_id === stage.id)}
                onApplicantClick={handleApplicantClick}
              />
            ))}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeApplicant ? <ApplicantCard applicant={activeApplicant} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            {sheetLoading || !selectedSubmission ? (
              <>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-64" />
              </>
            ) : (
              <>
                <SheetTitle className="text-2xl">{selectedSubmission.full_name}</SheetTitle>
                <SheetDescription>{selectedSubmission.email}</SheetDescription>
              </>
            )}
          </SheetHeader>
          
          {sheetLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">Application Responses</h3>
                <dl className="space-y-4">
                  {displayedSubmissionResponses.length > 0 ? (
                    displayedSubmissionResponses.map((res, index) => {
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
          )}

          {!sheetLoading && selectedSubmission && (
            <SheetFooter className="mt-8 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Change Stage:</span>
                <Select value={currentStageInSheet} onValueChange={setCurrentStageInSheet}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStageUpdateInSheet} disabled={sheetLoading || selectedSubmission.stage_id === currentStageInSheet}>
                Update Stage
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PipelineViewPage;