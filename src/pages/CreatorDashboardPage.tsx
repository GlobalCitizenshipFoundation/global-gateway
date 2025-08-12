import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Program } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";

const CreatorDashboardPage = () => {
  const { user } = useSession();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      // Fetch programs created by the user
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', user.id);

      if (programsError) {
        setError(programsError.message);
        setLoading(false);
        return;
      }
      
      const formattedPrograms = programsData.map(p => ({ ...p, deadline: new Date(p.deadline) })) as Program[];
      setPrograms(formattedPrograms);

      // Fetch applications for those programs
      const programIds = programsData.map(p => p.id);
      if (programIds.length > 0) {
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('applications')
          .select('id, program_id')
          .in('program_id', programIds);

        if (applicationsError) {
          setError(applicationsError.message);
        } else {
          setApplications(applicationsData || []);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const submissionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const app of applications) {
      counts.set(app.program_id, (counts.get(app.program_id) || 0) + 1);
    }
    return counts;
  }, [applications]);

  const getSubmissionCount = (programId: string) => {
    return submissionCounts.get(programId) || 0;
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-9 w-32" />
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Programs</h1>
          <p className="text-muted-foreground">Oversee all your active and past programs.</p>
        </div>
        <Button asChild>
          <Link to="/creator/new-program">Create New Program</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead className="text-center hidden md:table-cell">Submissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.length > 0 ? programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.title}</TableCell>
                  <TableCell className="text-center hidden md:table-cell">
                    {getSubmissionCount(program.id)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/creator/program/${program.id}/pipeline`}>Pipeline</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/creator/program/${program.id}/workflow`}>Workflow</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/creator/program/${program.id}/submissions`}>Submissions</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    You haven't created any programs yet.
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

export default CreatorDashboardPage;