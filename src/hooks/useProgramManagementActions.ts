import { supabase } from '@/integrations/supabase/client';
import { Program } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

interface UseProgramManagementActionsProps {
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
}

export const useProgramManagementActions = ({ setPrograms }: UseProgramManagementActionsProps) => {
  const handleDeleteProgram = async (program: Program) => {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', program.id);

    if (error) {
      showError(`Failed to delete program: ${error.message}`);
    } else {
      showSuccess(`Program "${program.title}" deleted successfully.`);
      setPrograms(prev => prev.filter(p => p.id !== program.id));
    }
  };

  const handleUpdateProgramStatus = async (programId: string, newStatus: 'draft' | 'published') => {
    const originalPrograms: Program[] = []; // Placeholder for original state if needed for complex rollback
    // Optimistic update
    setPrograms(prev => {
      const updated = prev.map(p => p.id === programId ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p);
      // In a real app, you might store prev here for a full rollback
      return updated;
    });

    const { error } = await supabase
      .from('programs')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', programId);

    if (error) {
      showError(`Failed to update program status: ${error.message}. Reverting.`);
      // Revert to original state if optimistic update fails
      // For simplicity, we'll re-fetch or manually revert if originalPrograms was stored
      setPrograms(prev => prev.map(p => p.id === programId ? { ...p, status: newStatus === 'published' ? 'draft' : 'published' } : p)); // Simple revert
    } else {
      showSuccess(`Program status updated to "${newStatus}".`);
    }
  };

  return {
    handleDeleteProgram,
    handleUpdateProgramStatus,
  };
};