import { useState, useEffect, useCallback } from 'react';
    import { supabase } from '@/integrations/supabase/client';
    import { useSession } from '@/contexts/auth/SessionContext';
    import { showError } from '@/utils/toast';
    import { Tag } from '@/types'; // Correctly import Tag

    export const useTagsData = () => {
      const { user, profile } = useSession();
      const [tags, setTags] = useState<Tag[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      const fetchTags = useCallback(async () => {
        if (!user || !profile) {
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        let query = supabase
          .from('tags')
          .select('*')
          .order('name', { ascending: true });

        // Only admins and super_admins can see all tags.
        // Creators can only see tags they created.
        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
          query = query.eq('user_id', user.id);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          setError(fetchError.message);
          showError("Error fetching tags: " + fetchError.message);
        } else {
          setTags(data as Tag[]);
        }
        setLoading(false);
      }, [user, profile]);

      useEffect(() => {
        fetchTags();
      }, [fetchTags]);

      return { tags, setTags, loading, error, fetchTags };
    };