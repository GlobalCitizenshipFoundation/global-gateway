import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
}

export const sendEmail = async ({ to, subject, htmlBody }: SendEmailOptions) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, htmlBody },
    });

    if (error) {
      console.error('Error invoking send-email function:', error);
      showError(`Failed to send email: ${error.message}`);
      return false;
    }

    if (data.error) {
      console.error('Edge Function returned an error:', data.error);
      showError(`Failed to send email: ${data.error}`);
      return false;
    }

    showSuccess("Email sent successfully!");
    return true;
  } catch (err: any) {
    console.error('Unexpected error calling send-email function:', err);
    showError(`An unexpected error occurred while sending email: ${err.message}`);
    return false;
  }
};

// Helper to fetch and send a template by name
export const sendEmailTemplate = async (templateName: string, recipientEmail: string, dynamicData: Record<string, string> = {}) => {
  const { data: template, error } = await supabase
    .from('email_templates')
    .select('subject, body')
    .eq('name', templateName)
    .eq('status', 'published') // Only send published templates
    .single();

  if (error || !template) {
    showError(`Failed to find published email template "${templateName}".`);
    console.error(`Error fetching template ${templateName}:`, error);
    return false;
  }

  let interpolatedSubject = template.subject;
  let interpolatedBody = template.body;

  // Simple string interpolation for dynamic data
  for (const key in dynamicData) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    interpolatedSubject = interpolatedSubject.replace(placeholder, dynamicData[key]);
    interpolatedBody = interpolatedBody.replace(placeholder, dynamicData[key]);
  }

  return sendEmail({
    to: recipientEmail,
    subject: interpolatedSubject,
    htmlBody: interpolatedBody,
  });
};

// New helper to fetch and send a template by ID
export const sendEmailByTemplateId = async (templateId: string, recipientEmail: string, dynamicData: Record<string, string> = {}) => {
  const { data: template, error } = await supabase
    .from('email_templates')
    .select('subject, body')
    .eq('id', templateId)
    .eq('status', 'published')
    .single();

  if (error || !template) {
    showError(`Failed to find published email template with ID "${templateId}".`);
    console.error(`Error fetching template ${templateId}:`, error);
    return false;
  }

  let interpolatedSubject = template.subject;
  let interpolatedBody = template.body;

  for (const key in dynamicData) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    interpolatedSubject = interpolatedSubject.replace(placeholder, dynamicData[key]);
    interpolatedBody = interpolatedBody.replace(placeholder, dynamicData[key]);
  }

  return sendEmail({
    to: recipientEmail,
    subject: interpolatedSubject,
    htmlBody: interpolatedBody,
  });
};