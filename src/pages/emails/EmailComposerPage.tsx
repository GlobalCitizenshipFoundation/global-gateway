import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailTemplateForm } from "@/components/email/EmailTemplateForm";
import { useEmailTemplateManagementActions } from "@/hooks/emails/useEmailTemplateManagementActions";
import { useEmailTemplatesData } from "@/hooks/emails/useEmailTemplatesData";
import { EmailTemplate } from "@/types";
import { showError, showSuccess } from "@/utils/toast"; // Import showSuccess
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/contexts/auth/SessionContext";
import { sendEmail } from "@/utils/emailSender";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

const EmailComposerPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const isNewTemplate = templateId === 'new';

  const { emailTemplates, loading: fetchLoading, error: fetchError, fetchEmailTemplates } = useEmailTemplatesData();
  const { isSubmitting, handleCreateEmailTemplate, handleUpdateEmailTemplate } = useEmailTemplateManagementActions({ setEmailTemplates: () => {}, fetchEmailTemplates });

  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | undefined>(undefined);
  const [pageLoading, setPageLoading] = useState(true);

  const [isTestEmailDialogOpen, setIsTestEmailDialogOpen] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState(user?.email || '');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const [selectedTemplateToLoad, setSelectedTemplateToLoad] = useState<string | null>(null); // State for "Use Template" dropdown

  useEffect(() => {
    if (!isNewTemplate && !fetchLoading) {
      const foundTemplate = emailTemplates.find(t => t.id === templateId);
      if (foundTemplate) {
        setCurrentTemplate(foundTemplate);
      } else {
        showError("Email template not found.");
        navigate("/creator/emails");
      }
      setPageLoading(false);
    } else if (isNewTemplate) {
      setPageLoading(false);
    }
  }, [templateId, isNewTemplate, emailTemplates, fetchLoading, navigate]);

  useEffect(() => {
    if (user?.email) {
      setTestRecipientEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (values: any) => {
    let success = false;
    if (isNewTemplate) {
      const newTemplate = await handleCreateEmailTemplate(values.name, values.subject, values.body_html, values.is_default); // Use body_html
      if (newTemplate) {
        success = true;
      }
    } else if (currentTemplate) {
      success = await handleUpdateEmailTemplate(currentTemplate.id, values);
    }

    if (success) {
      navigate("/creator/emails");
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipientEmail.trim()) {
      showError("Please enter a recipient email address.");
      return;
    }
    if (!currentTemplate) {
      showError("No template loaded to send a test email.");
      return;
    }

    setIsSendingTestEmail(true);
    const success = await sendEmail({
      to: testRecipientEmail,
      subject: `TEST: ${currentTemplate.subject}`,
      htmlBody: currentTemplate.body_html, // Use body_html
    });
    if (success) {
    } else {
    }
    setIsSendingTestEmail(false);
    setIsTestEmailDialogOpen(false);
  };

  const handleLoadTemplate = (templateIdToLoad: string) => {
    const templateToLoad = emailTemplates.find(t => t.id === templateIdToLoad);
    if (templateToLoad) {
      setCurrentTemplate(templateToLoad);
      // Reset form with loaded template data
      // This assumes EmailTemplateForm has a way to receive new initialData or reset its internal state
      // For now, we'll rely on the useEffect that watches currentTemplate
      showSuccess(`Template "${templateToLoad.name}" loaded.`);
    } else {
      showError("Selected template not found.");
    }
    setSelectedTemplateToLoad(templateIdToLoad);
  };

  if (pageLoading || fetchLoading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-6 w-48 mb-4" />
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return <div className="container py-12 text-center text-destructive">Error: {fetchError}</div>;
  }

  return (
    <div className="container py-12">
      <Link to="/creator/emails" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Email Templates
      </Link>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>{isNewTemplate ? "Create New Email Template" : `Edit Email Template: ${currentTemplate?.name}`}</CardTitle>
          <CardDescription>
            {isNewTemplate ? "Design a new email template from scratch." : "Modify the content and settings of this email template."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isNewTemplate && (
            <div className="mb-6">
              <Label htmlFor="load-template">Use Template</Label>
              <Select value={selectedTemplateToLoad || ''} onValueChange={handleLoadTemplate}>
                <SelectTrigger id="load-template">
                  <SelectValue placeholder="Load from existing template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.filter(t => t.status === 'published').map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">Selecting a template will pre-fill the subject and body.</p>
            </div>
          )}
          <EmailTemplateForm
            initialData={currentTemplate}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isNewTemplate={isNewTemplate}
          />
          {!isNewTemplate && (
            <div className="mt-6 pt-6 border-t flex justify-end">
              <Button variant="outline" onClick={() => setIsTestEmailDialogOpen(true)} disabled={isSubmitting}>
                Send Test Email
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isTestEmailDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Enter the recipient's email address to send a test version of this template.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="test-recipient-email">Recipient Email</Label>
                <Input
                  id="test-recipient-email"
                  type="email"
                  value={testRecipientEmail}
                  onChange={(e) => setTestRecipientEmail(e.target.value)}
                  disabled={isSendingTestEmail}
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsTestEmailDialogOpen(false)} disabled={isSendingTestEmail}>
                Cancel
              </Button>
              <Button onClick={handleSendTestEmail} disabled={isSendingTestEmail || !testRecipientEmail.trim()}>
                {isSendingTestEmail ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmailComposerPage;