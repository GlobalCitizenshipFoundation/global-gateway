import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
import { Application } from "@/types";

const mockApplications: Application[] = [
  {
    id: "app-01",
    programId: "1",
    programTitle: "Innovators in Science Scholarship",
    submittedDate: new Date("2024-07-15"),
    status: "In Review",
  },
  {
    id: "app-02",
    programId: "3",
    programTitle: "Art & Culture Award",
    submittedDate: new Date("2024-06-20"),
    status: "Accepted",
  },
  {
    id: "app-03",
    programId: "4",
    programTitle: "Environmental Conservation Fund",
    submittedDate: new Date("2024-05-01"),
    status: "Rejected",
  },
];

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

const DashboardPage = () => {
  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
          <CardDescription>
            Here is a list of all your submitted applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Link to={`/apply/${app.programId}`} className="font-medium hover:underline">
                      {app.programTitle}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {app.submittedDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
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

export default DashboardPage;