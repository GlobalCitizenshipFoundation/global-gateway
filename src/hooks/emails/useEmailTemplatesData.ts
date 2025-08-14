import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { EmailTemplate } from '@/types';
import { showError } from '@/utils/toast';

export const useEmailTemplatesData = () => {
  const { user, profile } = useSession();
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmailTemplates = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    // If user is not an admin or super_admin, only fetch their own templates and default templates
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      query = query.or(`user_id.eq.${user.id},is_default.eq.true`);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      showError("Error fetching email templates: " + fetchError.message);
    } else {
      setEmailTemplates(data as EmailTemplate[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmailTemplates();
  }, [user, profile]);

  return { emailTemplates, setEmailTemplates, loading, error, fetchEmailTemplates };
};