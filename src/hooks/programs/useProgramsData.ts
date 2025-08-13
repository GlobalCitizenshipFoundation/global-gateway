import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { Program } from '@/types';
import { showError } from '@/utils/toast';

export const useProgramsData = () => {
  const { user } = useSession();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, title, deadline, status, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (programsError) {
        setError(programsError.message);
        showError("Error fetching programs: " + programsError.message);
        setLoading(false);
        return;
      }
      
      const formattedPrograms = programsData.map(p => ({ ...p, deadline: new Date(p.deadline) })) as Program[];
      setPrograms(formattedPrograms);

      const programIds = programsData.map(p => p.id);
      if (programIds.length > 0) {
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('applications')
          .select('id, program_id')
          .in('program_id', programIds);

        if (applicationsError) {
          setError(applicationsError.message);
          showError("Error fetching submission counts: " + applicationsError.message);
        } else {
          const counts = new Map<string, number>();
          for (const app of applicationsData) {
            counts.set(app.program_id, (counts.get(app.program_id) || 0) + 1);
          }
          setSubmissionCounts(counts);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  return { programs, setPrograms, submissionCounts, loading, error };
};