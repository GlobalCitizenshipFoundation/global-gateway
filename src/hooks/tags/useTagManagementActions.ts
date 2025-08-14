import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { showError, showSuccess } from '@/utils/toast';
import { Tag } from '@/types';

interface UseTagManagementActionsProps {
  fetchTags: () => Promise<void>;
}

export const useTagManagementActions = ({ fetchTags }: UseTagManagementActionsProps) => {
  const { user } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTag = async (name: string, color: string, applicable_to: string[]) => {
    if (!user) {
      showError("You must be logged in to create a tag.");
      return null;
    }
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('tags')
      .insert({
        user_id: user.id,
        name,
        color,
        applicable_to,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to create tag: ${error.message}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Tag created successfully!");
      fetchTags();
      setIsSubmitting(false);
      return data as Tag;
    }
  };

  const handleUpdateTag = async (tagId: string, values: { name?: string; color?: string; applicable_to?: string[]; }) => {
    if (!user) {
      showError("You must be logged in to update a tag.");
      return false;
    }
    setIsSubmitting(true);
    const { error } = await supabase
      .from('tags')
      .update(values)
      .eq('id', tagId);

    if (error) {
      showError(`Failed to update tag: ${error.message}`);
      setIsSubmitting(false);
      return false;
    } else {
      showSuccess("Tag updated successfully!");
      fetchTags();
      setIsSubmitting(false);
      return true;
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) {
      showError(`Failed to delete tag: ${error.message}`);
    } else {
      showSuccess(`Tag "${tagName}" deleted successfully.`);
      fetchTags();
    }
    setIsSubmitting(false);
  };

  return {
    isSubmitting,
    handleCreateTag,
    handleUpdateTag,
    handleDeleteTag,
  };
};