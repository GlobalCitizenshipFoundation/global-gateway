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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";
import { ProgramStage } from "@/types";
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

type Response = {
  value: string | null;
  form_fields: {
    label: string;
    field_type: string;
  } | null;
}

const SubmissionDetailPage = () => {
  const { programId, submissionId } = useParams<{ programId: string, submissionId: string }>();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
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

      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('application_responses')
        .select(`value, form_fields ( label, field_type )`)
        .eq('application_id', submissionId);
      
      if (responsesError) {
        showError("Could not load application responses.");
      } else if (responsesData) {
        const formattedData = responsesData.map(res => ({
          ...res,
          form_fields: Array.isArray(res.form_fields) ? res.form_fields[0] : res.form_fields
        }));
        setResponses(formattedData as Response[]);
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

  const formatResponseValue = (response: Response) => {
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
      // Assuming the value is a public URL to the file
      const fileName = response.value.split('/').pop(); // Extract file name from URL
      return (
        <a href={response.value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          {fileName || 'View File'}
        </a>
      );
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
                {responses.map((res, index) => (
                  <div key={index}>
                    <dt className="font-medium text-sm">{res.form_fields?.label || 'Untitled Question'}</dt>
                    <dd className="text-muted-foreground whitespace-pre-wrap mt-1">{formatResponseValue(res)}</dd>
                  </div>
                ))}
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