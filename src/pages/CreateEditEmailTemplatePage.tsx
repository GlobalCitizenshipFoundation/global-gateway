import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailTemplateForm } from "@/components/email/EmailTemplateForm";
import { useEmailTemplateManagementActions } from "@/hooks/useEmailTemplateManagementActions";
import { useEmailTemplatesData } from "@/hooks/useEmailTemplatesData";
import { EmailTemplate } from "@/types";
import { showError } from "@/utils/toast";

const CreateEditEmailTemplatePage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const isNewTemplate = templateId === 'new';

  const { emailTemplates, loading: fetchLoading, error: fetchError, fetchEmailTemplates } = useEmailTemplatesData();
  const { isSubmitting, handleCreateEmailTemplate, handleUpdateEmailTemplate } = useEmailTemplateManagementActions({ setEmailTemplates: () => {}, fetchEmailTemplates });

  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | undefined>(undefined);
  const [pageLoading, setPageLoading] = useState(true);

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

  const handleSubmit = async (values: any) => {
    let success = false;
    if (isNewTemplate) {
      const newTemplate = await handleCreateEmailTemplate(values.name, values.subject, values.body, values.is_default);
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
          <EmailTemplateForm
            initialData={currentTemplate}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isNewTemplate={isNewTemplate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateEditEmailTemplatePage;