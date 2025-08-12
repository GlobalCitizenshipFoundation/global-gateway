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

type SubmissionDetail = {
  id: string;
  submitted_date: string;
  full_name: string;
  email: string;
  personal_statement: string;
  stage_id: string;
  programs: {
    title: string;
  } | null;
  program_stages: {
    name: string;
  } | null;
};

const SubmissionDetailPage = () => {
  const { programId, submissionId } = useParams<{ programId: string, submissionId: string }>();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
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
          <CardContent className="space-y-6" />
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
              <h3 className="font-semibold text-lg mb-2">Personal Statement</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{submission.personal_statement}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Application Details</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Program:</dt>
                <dd>{submission.programs?.title || 'Unknown Program'}</dd>
                <dt className="text-muted-foreground">Submitted On:</dt>
                <dd>{new Date(submission.submitted_date).toLocaleDateString()}</dd>
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