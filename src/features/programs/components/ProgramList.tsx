"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Briefcase, CalendarDays } from "lucide-react";
import { Program } from "@/features/campaigns/services/campaign-service"; // Reusing Program interface
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getProgramsAction, deleteProgramAction } from "../actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProgramList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my">("all"); // Programs are not public/private in the same way as templates/campaigns
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const fetchedPrograms = await getProgramsAction();
      if (fetchedPrograms) {
        setPrograms(fetchedPrograms);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load programs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchPrograms();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view programs.");
      setIsLoading(false);
    }
  }, [user, isSessionLoading]);

  useEffect(() => {
    let currentFiltered = programs;

    // Apply search term filter
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(
        (program) =>
          program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply visibility filter
    if (filter === "my" && user) {
      currentFiltered = currentFiltered.filter((program) => program.creator_id === user.id);
    }
    // "all" filter is handled by the initial fetch and search

    setFilteredPrograms(currentFiltered);
  }, [programs, filter, searchTerm, user]);

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteProgramAction(id);
      if (success) {
        toast.success("Program deleted successfully!");
        fetchPrograms(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete program.");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="rounded-xl shadow-md p-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-20 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const userRole: string = user?.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-display-small font-bold text-foreground">Programs</h1>
        <Button asChild className="rounded-full px-6 py-3 text-label-large">
          <Link href="/programs/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Program
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search programs by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-md"
        />
        <Select value={filter} onValueChange={(value: "all" | "my") => setFilter(value)}>
          <SelectTrigger className="w-[180px] rounded-md">
            <SelectValue placeholder="Filter by ownership" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="all" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">All Programs</SelectItem>
            {user && (
              <SelectItem value="my" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">My Programs</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {filteredPrograms.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Programs Found</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            {searchTerm ? "No programs match your search criteria." : "Start by creating your first program to group related campaigns."}
          </CardDescription>
          {!searchTerm && (
            <Button asChild className="mt-6 rounded-full px-6 py-3 text-label-large">
              <Link href="/programs/new">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Program Now
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => {
            const canEditOrDelete = user && (program.creator_id === user.id || isAdmin);
            return (
              <Card key={program.id} className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <CardHeader className="flex-grow">
                  <CardTitle className="text-headline-small text-primary flex items-center gap-2">
                    <Briefcase className="h-6 w-6" /> {program.name}
                  </CardTitle>
                  <CardDescription className="text-body-medium text-muted-foreground">
                    {program.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-body-small text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    Start: {program.start_date ? new Date(program.start_date).toLocaleDateString() : "N/A"}
                  </p>
                  <p className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    End: {program.end_date ? new Date(program.end_date).toLocaleDateString() : "N/A"}
                  </p>
                  <p>Status: <span className="font-medium capitalize">{program.status}</span></p>
                </CardContent>
                <div className="flex justify-end p-4 pt-0 space-x-2">
                  <Button asChild variant="outlined" size="icon" className="rounded-md">
                    <Link href={`/programs/${program.id}`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                  {canEditOrDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="rounded-md">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-headline-small">Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-body-medium text-muted-foreground">
                            This action cannot be undone. This will permanently delete the &quot;{program.name}&quot; program and any associated campaigns will have their program link removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(program.id)}
                            className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}