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
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type UserApplication = {
  id: string;
  submitted_date: string;
  status: 'Submitted' | 'In Review' | 'Accepted' | 'Rejected';
  program_id: string;
  programs: {
    title: string;
  } | null;
};

const getStatusVariant = (status: UserApplication['status']) => {
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
  const { user } = useSession();
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          submitted_date,
          status,
          program_id,
          programs (
            title
          )
        `)
        .eq('user_id', user.id)
        .order('submitted_date', { ascending: false });

      if (error) {
        setError(error.message);
        console.error("Error fetching applications:", error);
      } else if (data) {
        // Supabase might return the related record as an array, so we normalize it.
        const formattedData = data.map(app => ({
          ...app,
          programs: Array.isArray(app.programs) ? app.programs[0] : app.programs,
        }));
        setApplications(formattedData as UserApplication[]);
      }
      setLoading(false);
    };

    fetchApplications();
  }, [user]);

  if (loading) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="container py-12 text-center text-destructive">Error: {error}</div>;
  }

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
              {applications.length > 0 ? applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Link to={`/apply/${app.program_id}`} className="font-medium hover:underline">
                      {app.programs?.title || 'Unknown Program'}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(app.submitted_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    You haven't submitted any applications yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;