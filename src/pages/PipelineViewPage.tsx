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
import { ProgramStage, FormField, DisplayRule } from "@/types"; // Import FormField and DisplayRule
import { Applicant, ApplicantCard } from "@/components/ApplicantCard";
import { KanbanColumn } from "@/components/KanbanColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

type SubmissionDetail = {
  id: string;
  submitted_date: string;
  full_name: string;
  email: string;
  stage_id: string;
  program_stages: { name: string } | null;
};

type ResponseWithField = {
  value: string | null;
  form_fields: FormField | null; // Now includes full FormField type
};

// Component to handle async signed URL generation (re-used from SubmissionDetailPage)
const FileDownloadLink = ({ filePath }: { filePath: string }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);

  useEffect(() => {
    const generateSignedUrl = async () => {
      setLoadingUrl(true);
      setErrorUrl(null);
      const { data, error } = await supabase.storage
        .from('application-files')
        .createSignedUrl(filePath, 60 * 60); // URL valid for 1 hour

      if (error) {
        setErrorUrl("Failed to load file.");
        console.error("Error generating signed URL:", error);
      } else {
        setSignedUrl(data.signedUrl);
      }
      setLoadingUrl(false);
    };

    if (filePath) {
      generateSignedUrl();
    }
  }, [filePath]);

  if (loadingUrl) {
    return <span className="text-muted-foreground">Loading file...</span>;
  }

  if (errorUrl) {
    return <span className="text-destructive">{errorUrl}</span>;
  }

  if (!signedUrl) {
    return <span className="text-muted-foreground">File not available.</span>;
  }

  const fileName = filePath.split('/').pop();
  return (
    <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
      <Download className="h-4 w-4" /> {fileName || 'View File'}
    </a>
  );
};

const PipelineViewPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [programTitle, setProgramTitle] = useState("");
  const [stages, setStages] = useState<ProgramStage[]>([]);
  const [applications, setApplications] = useState<Applicant[]>([]);
  const [activeApplicant, setActiveApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);
  const [allSubmissionResponses, setAllSubmissionResponses] = useState<ResponseWithField[]>([]); // Store all fetched responses
  const [sheetLoading, setSheetLoading] = useState(false);
  const [currentStageInSheet, setCurrentStageInSheet] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!programId) return;
      setLoading(true);

      const programPromise = supabase.from("programs").select("title").eq("id", programId).single();
      const stagesPromise = supabase.from("program_stages").select("*").eq("program_id", programId).order("order", { ascending: true });
      const applicationsPromise = supabase.from("applications").select("id, full_name, stage_id").eq("program_id", programId);

      const [
        { data: programData, error: programError },
        { data: stagesData, error: stagesError },
        { data: applicationsData, error: applicationsError },
      ] = await Promise.all([programPromise, stagesPromise, applicationsPromise]);

      if (programError || stagesError || applicationsError) {
        showError("Failed to load pipeline data.");
      } else {
        setProgramTitle(programData.title);
        setStages(stagesData);
        setApplications(applicationsData);
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
      }
    }
  };

  // Helper function to evaluate a single display rule
  const evaluateRule = (rule: DisplayRule, currentResponsesMap: Record<string, string>, allFormFields: FormField[]): boolean => {
    const triggerFieldResponse = currentResponsesMap[rule.field_id];
    const triggerField = allFormFields.find(f => f.id === rule.field_id);

    if (!triggerField) return false; // Trigger field not found

    switch (rule.operator) {
      case 'equals':
        if (triggerField.field_type === 'checkbox') {
          try {
            const responseArray = JSON.parse(triggerFieldResponse || '[]') as string[];
            return Array.isArray(rule.value) ? rule.value.every(val => responseArray.includes(val)) : responseArray.includes(rule.value as string);
          } catch {
            return false;
          }
        }
        return triggerFieldResponse === rule.value;
      case 'not_equals':
        if (triggerField.field_type === 'checkbox') {
          try {
            const responseArray = JSON.parse(triggerFieldResponse || '[]') as string[];
            return Array.isArray(rule.value) ? !rule.value.every(val => responseArray.includes(val)) : !responseArray.includes(rule.value as string);
          } catch {
            return true;
          }
        }
        return triggerFieldResponse !== rule.value;
      case 'contains':
        return typeof triggerFieldResponse === 'string' && typeof rule.value === 'string' && triggerFieldResponse.includes(rule.value);
      case 'not_contains':
        return typeof triggerFieldResponse === 'string' && typeof rule.value === 'string' && !triggerFieldResponse.includes(rule.value);
      case 'is_empty':
        if (triggerField.field_type === 'checkbox') {
          try {
            const responseArray = JSON.parse(triggerFieldResponse || '[]') as string[];
            return responseArray.length === 0;
          } catch {
            return true;
          }
        }
        return !triggerFieldResponse || triggerFieldResponse.trim() === '';
      case 'is_not_empty':
        if (triggerField.field_type === 'checkbox') {
          try {
            const responseArray = JSON.parse(triggerFieldResponse || '[]') as string[];
            return responseArray.length > 0;
          } catch {
            return false;
          }
        }
        return !!triggerFieldResponse && triggerFieldResponse.trim() !== '';
      default:
        return false;
    }
  };

  // Helper function to determine if a field should be displayed based on rules and current responses
  const shouldFieldBeDisplayed = (field: FormField, currentResponsesMap: Record<string, string>, allFormFields: FormField[]): boolean => {
    if (!field.display_rules || field.display_rules.length === 0) {
      return true; // No rules, always display
    }
    // Assuming 'AND' logic for multiple rules for simplicity
    return field.display_rules.every(rule => evaluateRule(rule, currentResponsesMap, allFormFields));
  };

  // Memoize the filtered responses for the sheet
  const displayedSubmissionResponses = useMemo(() => {
    const currentResponsesMap: Record<string, string> = {};
    allSubmissionResponses.forEach(res => {
      if (res.form_fields?.id && res.value !== null) {
        currentResponsesMap[res.form_fields.id] = res.value;
      }
    });

    const allFormFields = allSubmissionResponses.map(res => res.form_fields).filter((f): f is FormField => f !== null);

    return allSubmissionResponses.filter(res => 
      res.form_fields && shouldFieldBeDisplayed(res.form_fields, currentResponsesMap, allFormFields)
    );
  }, [allSubmissionResponses]);

  const handleApplicantClick = async (applicant: Applicant) => {
    setIsSheetOpen(true);
    setSheetLoading(true);
    setSelectedSubmission(null);
    setAllSubmissionResponses([]);

    const { data: submissionData, error: submissionError } = await supabase
      .from('applications').select(`*, program_stages(name)`).eq('id', applicant.id).single();

    if (submissionError) {
      showError("Failed to load submission details.");
      setIsSheetOpen(false);
      setSheetLoading(false);
      return;
    }
    setSelectedSubmission(submissionData as SubmissionDetail);
    setCurrentStageInSheet(submissionData.stage_id);

    // Fetch responses with full form_fields data including display_rules
    const { data: responsesData, error: responsesError } = await supabase
      .from('application_responses').select(`value, form_fields ( id, label, field_type, options, is_required, order, display_rules )`).eq('application_id', applicant.id);
    
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
    const { error } = await supabase
      .from('applications').update({ stage_id: currentStageInSheet }).eq('id', selectedSubmission.id);

    if (error) {
      showError(`Failed to update stage: ${error.message}`);
    } else {
      setApplications(apps => apps.map(app => app.id === selectedSubmission.id ? { ...app, stage_id: currentStageInSheet } : app));
      showSuccess(`Application moved to a new stage.`);
      setIsSheetOpen(false);
    }
    setSheetLoading(false);
  };

  const formatResponseValue = (response: ResponseWithField) => {
    if (!response.value) return 'No answer provided';
    if (response.form_fields?.field_type === 'checkbox') {
      try {
        const values = JSON.parse(response.value);
        return Array.isArray(values) ? values.join(', ') : response.value;
      } catch (e) {
        return response.value; // Fallback for malformed data
      }
    }
    if (response.form_fields?.field_type === 'date') {
      try {
        return format(new Date(response.value), "PPP");
      } catch (e) {
        return response.value; // Fallback for invalid date string
      }
    }
    if (response.form_fields?.field_type === 'file') {
      // Use the new FileDownloadLink component for async signed URL
      return <FileDownloadLink filePath={response.value} />;
    }
    if (response.form_fields?.field_type === 'richtext') {
      // WARNING: Using dangerouslySetInnerHTML can expose your application to XSS attacks
      // if the content is not sanitized. For a production application, consider
      // using a library like DOMPurify to sanitize the HTML before rendering.
      return <div dangerouslySetInnerHTML={{ __html: response.value }} className="prose max-w-none" />;
    }
    return response.value;
  };

  if (loading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="flex gap-4">
          <Skeleton className="w-72 h-96" />
          <Skeleton className="w-72 h-96" />
          <Skeleton className="w-72 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-4">
        <Link to={`/creator/program/${programId}/submissions`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Submissions
        </Link>
        <Button asChild variant="outline">
          <Link to={`/creator/program/${programId}/form`}>Manage Form</Link>
        </Button>
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
                    displayedSubmissionResponses.map((res, index) => (
                      <div key={index}>
                        <dt className="font-medium text-sm">{res.form_fields?.label || 'Untitled Question'}</dt>
                        <dd className="text-muted-foreground whitespace-pre-wrap mt-1">{formatResponseValue(res)}</dd>
                      </div>
                    ))
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