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
import { ArrowLeft, Download } from "lucide-react";
import { useEffect, useState, useMemo } from "react"; // Import useMemo
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { ProgramStage, FormField, DisplayRule } from "@/types"; // Import FormField and DisplayRule
import { format } from "date-fns";

type SubmissionDetail = {
  id: string;
  submitted_date: string;
  full_name: string;
  email: string;
  stage_id: string;
  programs: {
    title: string;
  } | null;
  program_stages: {
    name: string;
  } | null;
};

type ResponseWithField = {
  value: string | null;
  form_fields: FormField | null; // Now includes full FormField type
}

// Component to handle async signed URL generation
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


const SubmissionDetailPage = () => {
  const { programId, submissionId } = useParams<{ programId: string, submissionId: string }>();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [allResponses, setAllResponses] = useState<ResponseWithField[]>([]); // Store all fetched responses
  const [programStages, setProgramStages] = useState<ProgramStage[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!submissionId || !programId) return;
      setLoading(true);
      setError(null);

      // Fetch submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('applications')
        .select(`*, programs(title), program_stages(name)`)
        .eq('id', submissionId)
        .single();

      if (submissionError) {
        setError(submissionError.message);
        setLoading(false);
        return;
      }
      setSubmission(submissionData as SubmissionDetail);
      setSelectedStage(submissionData.stage_id);

      // Fetch responses with full form_fields data including display_rules
      const { data: responsesData, error: responsesError } = await supabase
        .from('application_responses')
        .select(`value, form_fields ( id, label, field_type, options, is_required, order, display_rules )`)
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
        .select('*')
        .eq('program_id', programId)
        .order('order', { ascending: true });
      
      if (stagesError) {
        showError("Could not fetch program stages.");
      } else {
        setProgramStages(stagesData || []);
      }

      setLoading(false);
    };

    fetchSubmissionDetails();
  }, [submissionId, programId]);

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

  // Memoize the filtered responses to avoid re-calculation on every render
  const displayedResponses = useMemo(() => {
    const currentResponsesMap: Record<string, string> = {};
    allResponses.forEach(res => {
      if (res.form_fields?.id && res.value !== null) {
        currentResponsesMap[res.form_fields.id] = res.value;
      }
    });

    const allFormFields = allResponses.map(res => res.form_fields).filter((f): f is FormField => f !== null);

    return allResponses.filter(res => 
      res.form_fields && shouldFieldBeDisplayed(res.form_fields, currentResponsesMap, allFormFields)
    );
  }, [allResponses]);

  const handleStageUpdate = async () => {
    if (!submission || !selectedStage || submission.stage_id === selectedStage) return;
    setUpdating(true);
    const { data, error } = await supabase
      .from('applications')
      .update({ stage_id: selectedStage })
      .eq('id', submission.id)
      .select(`*, programs(title), program_stages(name)`)
      .single();

    if (error) {
      showError(`Failed to update stage: ${error.message}`);
    } else {
      setSubmission(data as SubmissionDetail);
      showSuccess(`Application moved to "${data.program_stages?.name}" stage.`);
    }
    setUpdating(false);
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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-5 w-64" />
              </div>
              <Skeleton className="h-7 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-28" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="container text-center py-12">
        <h1 className="text-2xl font-bold">Submission not found</h1>
        {error && <p className="text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Link to={`/creator/program/${programId}/submissions`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Submissions
      </Link>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{submission.full_name}</CardTitle>
              <CardDescription>{submission.email}</CardDescription>
            </div>
            <Badge variant="secondary">{submission.program_stages?.name}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Application Responses</h3>
              <dl className="space-y-4">
                {displayedResponses.length > 0 ? (
                  displayedResponses.map((res, index) => (
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
        </CardContent>
        <CardFooter className="flex justify-end items-center gap-4 bg-muted/50 p-4">
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
          <Button onClick={handleStageUpdate} disabled={updating || submission.stage_id === selectedStage}>
            {updating ? 'Updating...' : 'Update Stage'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubmissionDetailPage;