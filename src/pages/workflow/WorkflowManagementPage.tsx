import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkflowTemplatesData } from "@/hooks/workflow/useWorkflowTemplatesData";
import { useWorkflowTemplateActions } from "@/hooks/workflow/useWorkflowTemplateActions";
import { WorkflowTemplatesTable } from "@/components/workflow/WorkflowTemplatesTable";
import { DeleteWorkflowTemplateDialog } from "@/components/workflow/DeleteWorkflowTemplateDialog";
import { WorkflowTemplate } from "@/types";

const WorkflowManagementPage = () => {
  const { templates, setTemplates, loading, error, fetchTemplates } = useWorkflowTemplatesData();
  const { 
    isSubmitting, 
    handleCreateBlankTemplate,
    handleDeleteTemplate,
    handleUpdateTemplateStatus
  } = useWorkflowTemplateActions({ setTemplates, fetchTemplates });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const openDeleteDialog = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTemplate) {
      handleDeleteTemplate(selectedTemplate.id);
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-24" />
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
            <h1 className="text-3xl font-bold">Manage Workflows</h1>
            <p className="text-muted-foreground">Design and manage reusable workflow templates for your programs.</p>
          </div>
          <Button onClick={handleCreateBlankTemplate} disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" /> Create New Template
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <WorkflowTemplatesTable
              templates={templates}
              onUpdateStatus={handleUpdateTemplateStatus}
              onDelete={openDeleteDialog}
            />
          </CardContent>
        </Card>
      </div>
      <DeleteWorkflowTemplateDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        templateToDelete={selectedTemplate}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
};

export default WorkflowManagementPage;