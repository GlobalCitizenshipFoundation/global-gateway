import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkflowTemplatesData } from "@/hooks/workflows/useWorkflowTemplatesData";
import { useWorkflowTemplateActions } from "@/hooks/workflows/useWorkflowTemplateActions";

const WorkflowManagementPage = () => {
  const { templates, setTemplates, loading, error, fetchTemplates } = useWorkflowTemplatesData();
  const { isSubmitting, handleCreateBlankTemplate } = useWorkflowTemplateActions({ setTemplates, fetchTemplates });

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
            {/* A full table component will be added in a future step */}
            <div className="p-6 text-center text-muted-foreground">
              {templates.length > 0 ? `${templates.length} workflow templates loaded. Table UI coming soon.` : "No workflow templates found. Create one to get started!"}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default WorkflowManagementPage;