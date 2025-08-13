import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApplicationAssignment } from "@/types";
import { Badge } from "@/components/ui/badge";

interface AssignedApplicationsTableProps {
  assignments: ApplicationAssignment[];
}

export const AssignedApplicationsTable = ({ assignments }: AssignedApplicationsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Applicant</TableHead>
          <TableHead>Program</TableHead>
          <TableHead className="hidden md:table-cell">Submitted</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.length > 0 ? assignments.map((assignment) => {
          const application = assignment.applications;
          return (
            <TableRow key={assignment.id}>
              <TableCell className="font-medium">{application?.full_name || 'N/A'}</TableCell>
              <TableCell>{application?.programs?.title || 'N/A'}</TableCell>
              <TableCell className="hidden md:table-cell">
                {application?.submitted_date ? new Date(application.submitted_date).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{application?.program_stages?.name || 'N/A'}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/creator/program/${application?.program_id}/submission/${application?.id}`}>
                    Review
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        }) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center h-24">
              You have no assigned applications.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};