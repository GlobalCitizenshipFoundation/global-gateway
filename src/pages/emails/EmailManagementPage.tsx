import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { useEmailTemplatesData } from "@/hooks/emails/useEmailTemplatesData";
import { useEmailTemplateManagementActions } from "@/hooks/emails/useEmailTemplateManagementActions";
import { EmailTemplatesTable } from "@/components/email/EmailTemplatesTable";
import { DeleteEmailTemplateDialog } from "@/components/email/DeleteEmailTemplateDialog";
import { EmailTemplatePreviewDialog } from "@/components/email/EmailTemplatePreviewDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { EmailTemplate } from "@/types";

const EmailManagementPage = () => {
  const { emailTemplates, setEmailTemplates, loading, error, fetchEmailTemplates } = useEmailTemplatesData();
  const {
    handleDeleteEmailTemplate,
    handleUpdateEmailTemplateStatus,
  } = useEmailTemplateManagementActions({ setEmailTemplates, fetchEmailTemplates });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplateToDelete, setSelectedTemplateToDelete] = useState<EmailTemplate | null>(null);

  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplateToPreview, setSelectedTemplateToPreview] = useState<EmailTemplate | null>(null);

  const openDeleteDialog = (template: EmailTemplate) => {
    setSelectedTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (selectedTemplateToDelete) {
      handleDeleteEmailTemplate(selectedTemplateToDelete.id, selectedTemplateToDelete.name);
      setSelectedTemplateToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openPreviewDialog = (template: EmailTemplate) => {
    setSelectedTemplateToPreview(template);
    setIsPreviewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-9 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="container py-12 text-center text-destructive">Error: {error}</div>;
  }

  return (
    <>
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Email Templates</h1>
            <p className="text-muted-foreground">Create and manage email templates for your application.</p>
          </div>
          <Button asChild>
            <Link to="/creator/emails/compose">
              <Plus className="mr-2 h-4 w-4" /> Create New Template
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <EmailTemplatesTable
              emailTemplates={emailTemplates}
              onUpdateStatus={handleUpdateEmailTemplateStatus}
              onDelete={openDeleteDialog}
              onPreview={openPreviewDialog}
            />
          </CardContent>
        </Card>
      </div>

      <DeleteEmailTemplateDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        templateToDelete={selectedTemplateToDelete}
        onConfirmDelete={confirmDeleteTemplate}
      />

      <EmailTemplatePreviewDialog
        isOpen={isPreviewDialogOpen}
        onClose={() => setIsPreviewDialogOpen(false)}
        template={selectedTemplateToPreview}
      />
    </>
  );
};

export default EmailManagementPage;