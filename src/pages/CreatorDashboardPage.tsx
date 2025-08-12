import { Link } from "react-router-dom";
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
import { Program } from "@/types";

const getStatusVariant = (status: Program['status']) => {
  switch (status) {
    case 'Open':
      return 'default';
    case 'Closed':
      return 'destructive';
    case 'Reviewing':
      return 'secondary';
    default:
      return 'outline';
  }
};

const CreatorDashboardPage = () => {
  const getSubmissionCount = (programId: string) => {
    return mockApplications.filter(app => app.programId === programId).length;
  };

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Programs</h1>
          <p className="text-muted-foreground">Oversee all your active and past programs.</p>
        </div>
        <Button disabled>Create New Program</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center hidden md:table-cell">Submissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.title}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusVariant(program.status)}>{program.status}</Badge>
                  </TableCell>
                  <TableCell className="text-center hidden md:table-cell">
                    {getSubmissionCount(program.id)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/creator/program/${program.id}/submissions`}>View Submissions</Link>
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

export default CreatorDashboardPage;