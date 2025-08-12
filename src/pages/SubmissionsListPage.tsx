import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockPrograms, mockApplications } from "@/lib/mock-data";
import { Application } from "@/types";
import { ArrowLeft } from "lucide-react";

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

const SubmissionsListPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const program = mockPrograms.find(p => p.id === programId);
  const submissions = mockApplications.filter(app => app.programId === programId);

  if (!program) {
    return (
      <div className="container text-center py-12">
        <h1 className="text-2xl font-bold">Program not found</h1>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Link to="/creator/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Programs
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Submissions for: {program.title}</CardTitle>
          <CardDescription>
            Review and manage all applications for this program.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitter</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.fullName}</div>
                    <div className="text-sm text-muted-foreground">{app.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {app.submittedDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/creator/program/${programId}/submission/${app.id}`}>Review</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionsListPage;