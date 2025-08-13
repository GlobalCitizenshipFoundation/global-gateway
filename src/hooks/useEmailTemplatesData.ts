import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { EmailTemplate } from '@/types';
import { showError } from '@/utils/toast';

export const useEmailTemplatesData = () => {
  const { user } = useSession();
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmailTemplates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch templates created by the current user, and all default templates
    const { data, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .or(`user_id.eq.${user.id},is_default.eq.true`) // Fetch user's own or default templates
      .order('name', { ascending: true });

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
  }, [user]);

  return { emailTemplates, setEmailTemplates, loading, error, fetchEmailTemplates };
};