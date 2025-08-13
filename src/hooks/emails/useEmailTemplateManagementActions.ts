import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/auth/SessionContext';
import { EmailTemplate } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

interface UseEmailTemplateManagementActionsProps {
  setEmailTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
  fetchEmailTemplates: () => Promise<void>;
}

export const useEmailTemplateManagementActions = ({ setEmailTemplates, fetchEmailTemplates }: UseEmailTemplateManagementActionsProps) => {
  const { user } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateEmailTemplate = async (name: string, subject: string, body: string, isDefault: boolean) => {
    if (!user) {
      showError("You must be logged in to create an email template.");
      return null;
    }
    setIsSubmitting(true);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        user_id: user.id,
        name: name,
        subject: subject,
        body: body,
        is_default: isDefault,
        status: 'draft', // New templates start as draft
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to create email template: ${error.message}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Email template created successfully!");
      setEmailTemplates(prev => [...prev, data as EmailTemplate]);
      setIsSubmitting(false);
      return data as EmailTemplate;
    }
  };

  const handleUpdateEmailTemplate = async (templateId: string, values: { name?: string; subject?: string; body?: string; is_default?: boolean; status?: 'draft' | 'published'; }) => {
    if (!user) {
      showError("You must be logged in to update an email template.");
      return false;
    }
    setIsSubmitting(true);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('email_templates')
      .update({
        ...values,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
        updated_at: now, // Also update the general updated_at
      })
      .eq('id', templateId);

    if (error) {
      showError(`Failed to update email template: ${error.message}`);
      setIsSubmitting(false);
      return false;
    } else {
      showSuccess("Email template updated successfully!");
      fetchEmailTemplates(); // Re-fetch to ensure UI consistency
      setIsSubmitting(false);
      return true;
    }
  };

  const handleDeleteEmailTemplate = async (templateId: string, templateName: string) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      showError(`Failed to delete email template: ${error.message}`);
    } else {
      showSuccess(`Email template "${templateName}" deleted successfully.`);
      setEmailTemplates(prev => prev.filter(t => t.id !== templateId));
    }
    setIsSubmitting(false);
  };

  const handleUpdateEmailTemplateStatus = async (templateId: string, newStatus: 'draft' | 'published') => {
    return handleUpdateEmailTemplate(templateId, { status: newStatus });
  };

  return {
    isSubmitting,
    handleCreateEmailTemplate,
    handleUpdateEmailTemplate,
    handleDeleteEmailTemplate,
    handleUpdateEmailTemplateStatus,
  };
};