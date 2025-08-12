import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProgramsData } from "@/hooks/useProgramsData";
import { useProgramManagementActions } from "@/hooks/useProgramManagementActions";
import { ProgramsTable } from "@/components/programs/ProgramsTable";
import { DeleteProgramDialog } from "@/components/programs/DeleteProgramDialog";
import { useState } from "react";
import { Program } from "@/types";

const CreatorDashboardPage = () => {
  const { programs, setPrograms, submissionCounts, loading, error } = useProgramsData();
  const { handleDeleteProgram, handleUpdateProgramStatus } = useProgramManagementActions({ setPrograms });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const openDeleteDialog = (program: Program) => {
    setSelectedProgram(program);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProgram = () => {
    if (selectedProgram) {
      handleDeleteProgram(selectedProgram);
      setSelectedProgram(null);
      setIsDeleteDialogOpen(false);
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
            <ProgramsTable
              programs={programs}
              submissionCounts={submissionCounts}
              onUpdateStatus={handleUpdateProgramStatus}
              onDelete={handleDeleteProgram} // This prop is now redundant, but kept for clarity if needed elsewhere
              onOpenDeleteDialog={openDeleteDialog}
            />
          </CardContent>
        </Card>
      </div>
      <DeleteProgramDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        programToDelete={selectedProgram}
        onConfirmDelete={confirmDeleteProgram}
      />
    </>
  );
};

export default CreatorDashboardPage;