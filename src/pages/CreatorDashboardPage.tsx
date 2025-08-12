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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Program } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, FileText, Plus } from "lucide-react"; // Added FileText and Plus icons
import { showError, showSuccess } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";

// Extend Program type to include application_count from the view
type ProgramSummary = Program & {
  application_count: number;
};

const CreatorDashboardPage = () => {
  const { user } = useSession();
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramSummary | null>(null);

  const fetchPrograms = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    // Fetch from the new program_summary view
    const { data: programsData, error: programsError } = await supabase
      .from('program_summary')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (programsError) {
      setError(programsError.message);
    } else {
      const formattedPrograms = programsData.map(p => ({ ...p, deadline: new Date(p.deadline) })) as ProgramSummary[];
      setPrograms(formattedPrograms);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPrograms();

    // Set up real-time subscription for applications table
    const channel = supabase
      .channel('creator_dashboard_applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, payload => {
        // When an application changes (inserted, updated, deleted), re-fetch programs
        // This will update the application_count in the program_summary view
        fetchPrograms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPrograms]);

  const handleDeleteProgram = async () => {
    if (!selectedProgram) return;

    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', selectedProgram.id);

    if (error) {
      showError(`Failed to delete program: ${error.message}`);
    } else {
      showSuccess(`Program "${selectedProgram.title}" deleted successfully.`);
      // No need to manually filter, real-time subscription will trigger fetchPrograms
    }
    setSelectedProgram(null);
    setIsDeleteDialogOpen(false);
  };

  const handleUpdateProgramStatus = async (programId: string, newStatus: 'draft' | 'published') => {
    const originalPrograms = [...programs];
    // Optimistic update
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p));

    const { error } = await supabase
      .from('programs')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', programId);

    if (error) {
      showError(`Failed to update program status: ${error.message}. Reverting.`);
      setPrograms(originalPrograms); // Revert on error
    } else {
      showSuccess(`Program status updated to "${newStatus}".`);
    }
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
    <>
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
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                  <TableHead className="hidden xl:table-cell">Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.length > 0 ? programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.title}</TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      {program.application_count}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={program.status === 'published' ? 'default' : 'secondary'}>
                        {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {new Date(program.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {new Date(program.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/creator/program/${program.id}/submissions`}>View Submissions</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/creator/program/${program.id}/pipeline`}>View Pipeline</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Configuration</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/creator/program/${program.id}/edit`}>Edit Program</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/creator/program/${program.id}/workflow`}>Manage Workflow</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/creator/forms/${program.form_id}/edit`}>Manage Form</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Status</DropdownMenuLabel>
                          {program.status === 'draft' ? (
                            <DropdownMenuItem onClick={() => handleUpdateProgramStatus(program.id, 'published')}>
                              Publish
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateProgramStatus(program.id, 'draft')}>
                              Unpublish (Set to Draft)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedProgram(program);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            Delete Program
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground text-sm">
                          You haven't created any programs yet.
                        </p>
                        <p className="text-muted-foreground text-sm mt-1">
                          Click "Create New Program" to get started!
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the program
              <span className="font-semibold"> "{selectedProgram?.title}" </span>
              and all of its associated submissions and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedProgram(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProgram}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreatorDashboardPage;