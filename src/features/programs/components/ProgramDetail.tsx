"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Briefcase, CalendarDays, Edit, PlusCircle } from "lucide-react";
import { Program } from "@/features/campaigns/services/campaign-service"; // Reusing Program interface
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getProgramByIdAction } from "../actions";
import { CampaignListForProgram } from "@/features/campaigns/components/CampaignListForProgram"; // New component for campaigns within a program

interface ProgramDetailProps {
  programId: string;
}

export function ProgramDetail({ programId }: ProgramDetailProps) {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgramDetails = async () => {
    setIsLoading(true);
    try {
      const fetchedProgram = await getProgramByIdAction(programId);
      if (!fetchedProgram) {
        toast.error("Program not found or unauthorized.");
        router.push("/workbench/programs");
        return;
      }
      setProgram(fetchedProgram);
    } catch (error: any) {
      toast.error(error.message || "Failed to load program details.");
      router.push("/workbench/programs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchProgramDetails();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view programs.");
      router.push("/login");
    }
  }, [user, isSessionLoading, programId]);

  if (isLoading || !program) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <Card className="rounded-xl shadow-md p-6">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-20 w-full mb-4" />
        </Card>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="rounded-xl shadow-md p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentUser = user!;
  const currentProgram = program!;

  const userRole: string = currentUser.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';
  const canModifyProgram: boolean = currentProgram.creator_id === currentUser.id || isAdmin;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href="/workbench/programs">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Programs
          </Link>
        </Button>
        <div className="flex space-x-2">
          {canModifyProgram && (
            <Button asChild className="rounded-full px-6 py-3 text-label-large">
              <Link href={`/workbench/programs/${currentProgram.id}/edit`}>
                <Edit className="mr-2 h-5 w-5" /> Edit Program Details
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" /> {currentProgram.name}
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            {currentProgram.description || "No description provided for this program."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground">
          <p>Created: {new Date(currentProgram.created_at).toLocaleDateString()}</p>
          <p>Last Updated: {new Date(currentProgram.updated_at).toLocaleDateString()}</p>
          <p className="flex items-center gap-1 mt-2">
            <CalendarDays className="h-4 w-4" />
            Start: {currentProgram.start_date ? new Date(currentProgram.start_date).toLocaleDateString() : "N/A"}
          </p>
          <p className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            End: {currentProgram.end_date ? new Date(currentProgram.end_date).toLocaleDateString() : "N/A"}
          </p>
          <p>Status: <span className="font-medium capitalize">{currentProgram.status}</span></p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-8">
        <h2 className="text-headline-large font-bold text-foreground">Campaigns in this Program</h2>
        {canModifyProgram && (
          <Button asChild className="rounded-full px-6 py-3 text-label-large">
            <Link href={`/workbench/campaigns/new?programId=${currentProgram.id}`}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Campaign
            </Link>
          </Button>
        )}
      </div>

      <CampaignListForProgram programId={currentProgram.id} canModifyProgram={canModifyProgram} />
    </div>
  );
}