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
import { mockApplications } from "@/lib/mock-data";
import { Application } from "@/types";
import { ArrowLeft, Check, X } from "lucide-react";

const getStatusVariant = (status: Application['status']) => {
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
  const submission = mockApplications.find(app => app.id === submissionId);

  if (!submission) {
    return (
      <div className="container text-center py-12">
        <h1 className="text-2xl font-bold">Submission not found</h1>
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
              <CardTitle className="text-2xl">{submission.fullName}</CardTitle>
              <CardDescription>{submission.email}</CardDescription>
            </div>
            <Badge variant={getStatusVariant(submission.status)}>{submission.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Personal Statement</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{submission.personalStatement}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Application Details</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Program:</dt>
                <dd>{submission.programTitle}</dd>
                <dt className="text-muted-foreground">Submitted On:</dt>
                <dd>{submission.submittedDate.toLocaleDateString()}</dd>
              </dl>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="destructive" disabled>
            <X className="mr-2 h-4 w-4" />
            Decline
          </Button>
          <Button variant="default" disabled>
            <Check className="mr-2 h-4 w-4" />
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubmissionDetailPage;