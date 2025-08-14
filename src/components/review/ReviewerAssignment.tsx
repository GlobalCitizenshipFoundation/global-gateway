import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationAssignment, Profile } from '@/types';
import { showError, showSuccess } from '@/utils/toast';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import AvatarWithInitials from '../common/AvatarWithInitials';
import { cn } from '@/lib/utils';
import React from 'react'; // Explicit React import

interface ReviewerAssignmentProps {
  applicationId: string;
}

type ReviewerProfile = Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email' | 'avatar_url'>;

export const ReviewerAssignment = ({ applicationId }: ReviewerAssignmentProps) => {
  const [assignments, setAssignments] = useState<ApplicationAssignment[]>([]);
  const [potentialReviewers, setPotentialReviewers] = useState<ReviewerProfile[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoading(true);
      const assignmentsPromise = supabase
        .from('application_assignments')
        .select('*, profiles(first_name, last_name, avatar_url, email)')
        .eq('application_id', applicationId);

      const reviewersPromise = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('role', ['reviewer', 'lead_reviewer', 'admin', 'super_admin']);

      const [{ data: assignmentsData, error: assignmentsError }, { data: reviewersData, error: reviewersError }] = await Promise.all([assignmentsPromise, reviewersPromise]);

      if (assignmentsError) showError("Failed to load assignments.");
      else setAssignments(assignmentsData as ApplicationAssignment[]);

      if (reviewersError) showError("Failed to load potential reviewers.");
      else setPotentialReviewers(reviewersData as ReviewerProfile[]);
      
      setLoading(false);
    };
    fetchData();
  }, [applicationId]);

  const assignedReviewerIds = useMemo(() => new Set(assignments.map((a: ApplicationAssignment) => a.reviewer_id)), [assignments]);
  const unassignedReviewers = useMemo(() => potentialReviewers.filter((r: ReviewerProfile) => !assignedReviewerIds.has(r.id)), [potentialReviewers, assignedReviewerIds]);

  const handleAddReviewer = async (reviewerId: string): Promise<void> => {
    setOpen(false);
    const { data, error } = await supabase
      .from('application_assignments')
      .insert({ application_id: applicationId, reviewer_id: reviewerId })
      .select('*, profiles(first_name, last_name, avatar_url, email)')
      .single();

    if (error) {
      showError(`Failed to assign reviewer: ${error.message}`);
    } else {
      setAssignments(prev => [...prev, data as ApplicationAssignment]);
      showSuccess("Reviewer assigned successfully.");
    }
  };

  const handleRemoveReviewer = async (assignmentId: string): Promise<void> => {
    const { error } = await supabase
      .from('application_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      showError(`Failed to remove reviewer: ${error.message}`);
    } else {
      setAssignments(prev => prev.filter((a: ApplicationAssignment) => a.id !== assignmentId));
      showSuccess("Reviewer removed successfully.");
    }
  };

  const getFullName = (profile: { first_name: string | null; last_name: string | null; email?: string | null; }) => {
    return [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Reviewers</CardTitle>
        <CardDescription>Manage who can review this application.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment: ApplicationAssignment) => (
            <div key={assignment.id} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center gap-3">
                <AvatarWithInitials name={getFullName(assignment.profiles!)} src={assignment.profiles?.avatar_url} className="h-9 w-9" />
                <div>
                  <p className="font-medium">{getFullName(assignment.profiles!)}</p>
                  <p className="text-sm text-muted-foreground">{assignment.profiles?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemoveReviewer(assignment.id)}>
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {loading && <p className="text-sm text-muted-foreground">Loading assignments...</p>}
          {!loading && assignments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No reviewers assigned yet.</p>}
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between mt-4">
              Add a reviewer...
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search reviewers..." />
              <CommandList>
                <CommandEmpty>No reviewers found.</CommandEmpty>
                <CommandGroup>
                  {unassignedReviewers.map((reviewer: ReviewerProfile) => (
                    <CommandItem
                      key={reviewer.id}
                      value={`${getFullName(reviewer)} ${reviewer.email}`}
                      onSelect={() => handleAddReviewer(reviewer.id)}
                    >
                      <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                      {getFullName(reviewer) || reviewer.email}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
};