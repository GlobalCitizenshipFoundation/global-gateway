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
import { ArrowLeft, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { showError, showSuccess } from "@/utils/toast";

type SubmissionDetail = {
  id: string;
  submitted_date: string;
  status: 'Submitted' | 'In Review' | 'Accepted' | 'Rejected';
  full_name: string;
  email: string;
  personal_statement: string;
  programs: {
    title: string;
  } | null;
};

const getStatusVariant = (status: SubmissionDetail['status']) => {
  switch (status) {
    case 'Accepted':
      return 'default';
    case 'Rejected':
      return 'destructive';
    case 'In Review':
      return 'secondary';
    default:
      return 'outline';
  }
};

const SubmissionDetailPage = () => {
  const { programId, submissionId } = useParams<{ programId: string, submissionId: string }>();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) return;
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          programs (
            title
          )
        `)
        .eq('id', submissionId)
        .single();

      if (error) {
        setError(error.message);
        console.error("Error fetching submission:", error);
      } else {
        setSubmission(data as SubmissionDetail);
      }
      setLoading(false);
    };

    fetchSubmission();
  }, [submissionId]);

  const handleStatusUpdate = async (newStatus: 'Accepted' | 'Rejected') => {
    if (!submission) return;
    setUpdating(true);
    const { data, error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', submission.id)
      .select(`*, programs(title)`)
      .single();

    if (error) {
      showError(`Failed to update status: ${error.message}`);
    } else {
      setSubmission(data as SubmissionDetail);
      showSuccess(`Application has been ${newStatus.toLowerCase()}.`);
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
          <CardContent className="space-y-6">
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Skeleton className="h-10 w-28" />
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
            <Badge variant={getStatusVariant(submission.status)}>{submission.status}</Badge>
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
        <CardFooter className="flex justify-end gap-2">
          <Button variant="destructive" onClick={() => handleStatusUpdate('Rejected')} disabled={updating || submission.status !== 'Submitted' && submission.status !== 'In Review'}>
            <X className="mr-2 h-4 w-4" />
            Decline
          </Button>
          <Button variant="default" onClick={() => handleStatusUpdate('Accepted')} disabled={updating || submission.status !== 'Submitted' && submission.status !== 'In Review'}>
            <Check className="mr-2 h-4 w-4" />
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubmissionDetailPage;