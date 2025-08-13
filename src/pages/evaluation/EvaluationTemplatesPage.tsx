import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Plus } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";
import { useEvaluationTemplatesData } from "../../hooks/evaluation/useEvaluationTemplatesData";
import { useEvaluationTemplateActions } from "../../hooks/evaluation/useEvaluationTemplateActions";
import { EvaluationTemplatesTable } from "../../components/evaluation/EvaluationTemplatesTable";
import { DeleteEvaluationTemplateDialog } from "../../components/evaluation/DeleteEvaluationTemplateDialog";
import { EvaluationTemplate } from "../../types";

const EvaluationTemplatesPage = () => {
  const { templates, loading, error, fetchTemplates } = useEvaluationTemplatesData();
  const { isSubmitting, handleCreateTemplate, handleDeleteTemplate } = useEvaluationTemplateActions({ fetchTemplates });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EvaluationTemplate | null>(null);

  const openDeleteDialog = (template: EvaluationTemplate) => {
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
                  <Skeleton className="h-5 w-1/4" />
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
            <h1 className="text-3xl font-bold">Manage Evaluation Templates</h1>
            <p className="text-muted-foreground">Create and manage reusable scorecards for your review stages.</p>
          </div>
          <Button onClick={handleCreateTemplate} disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" /> Create New Template
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <EvaluationTemplatesTable
              templates={templates}
              onDelete={openDeleteDialog}
            />
          </CardContent>
        </Card>
      </div>
      <DeleteEvaluationTemplateDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        templateToDelete={selectedTemplate}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
};

export default EvaluationTemplatesPage;