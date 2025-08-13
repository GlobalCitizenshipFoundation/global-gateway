import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError } from '@/utils/toast';
import { ApplicationAssignment } from '@/types';

export const useReviewerDashboardData = () => {
  const { user } = useSession();
  const [assignments, setAssignments] = useState<ApplicationAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('application_assignments')
        .select(`
          id,
          created_at,
          application_id,
          reviewer_id,
          applications (
            id,
            full_name,
            submitted_date,
            program_id,
            programs ( title ),
            program_stages ( name )
          )
        `)
        .eq('reviewer_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        showError("Error fetching assigned applications: " + fetchError.message);
      } else {
        const formattedData = data.map(assignment => {
          const applicationData = Array.isArray(assignment.applications) ? assignment.applications[0] : assignment.applications;
          
          if (!applicationData) {
            return { ...assignment, applications: null };
          }

          const formattedApplication = {
            ...applicationData,
            programs: Array.isArray(applicationData.programs) ? applicationData.programs[0] : applicationData.programs,
            program_stages: Array.isArray(applicationData.program_stages) ? applicationData.program_stages[0] : applicationData.program_stages,
          };

          return {
            ...assignment,
            applications: formattedApplication,
          };
        });
        setAssignments(formattedData as ApplicationAssignment[]);
      }
      setLoading(false);
    };

    fetchAssignments();
  }, [user]);

  return { assignments, loading, error };
};