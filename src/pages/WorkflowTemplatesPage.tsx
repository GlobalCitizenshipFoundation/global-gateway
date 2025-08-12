import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { WorkflowTemplate } from "@/types"; // Will define WorkflowTemplate type soon
import { WorkflowTemplatesTable } from "@/components/workflow-templates/WorkflowTemplatesTable";
import { DeleteWorkflowTemplateDialog } from "@/components/workflow-templates/DeleteWorkflowTemplateDialog";
import { CreateWorkflowTemplateDialog } from "@/components/workflow-templates/CreateWorkflowTemplateDialog";
import { useWorkflowTemplatesData } from "@/hooks/useWorkflowTemplatesData";
import { useWorkflowTemplateManagementActions } from "@/hooks/useWorkflowTemplateManagementActions";

const WorkflowTemplatesPage = () => {
  const { workflowTemplates, setWorkflowTemplates, loading, error } = useWorkflowTemplatesData();
  const {
    isDeleteDialogOpen, setIsDeleteDialogOpen, selectedTemplate, setSelectedTemplate, handleDeleteWorkflowTemplate,
    isCreateDialogOpen, setIsCreateDialogOpen, newTemplateName, setNewTemplateName, isCreating, handleCreateWorkflowTemplate,
    handleUpdateWorkflowTemplateStatus,
  } = useWorkflowTemplateManagementActions({ setWorkflowTemplates });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [sortBy, setSortBy] = useState<"name" | "updated_at" | "created_at">("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedTemplates = useMemo(() => {
    let displayTemplates = [...workflowTemplates];

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      displayTemplates = displayTemplates.filter(
        (template) =>
          template.name.toLowerCase().includes(lowerCaseSearch) ||
          (template.description && template.description.toLowerCase().includes(lowerCaseSearch))
      );
    }

    if (statusFilter !== "all") {
      displayTemplates = displayTemplates.filter((template) => template.status === statusFilter);
    }

    displayTemplates.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === "name") {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === "updated_at") {
        const dateA = new Date(a.last_edited_at || a.updated_at).getTime();
        const dateB = new Date(b.last_edited_at || b.updated_at).getTime();
        compareValue = dateA - dateB;
      } else if (sortBy === "created_at") {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        compareValue = dateA - dateB;
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return displayTemplates;
  }, [workflowTemplates, searchTerm, statusFilter, sortBy, sortOrder]);

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
            <h1 className="text-3xl font-bold">Manage Workflow Templates</h1>
            <p className="text-muted-foreground">Create and manage reusable workflow templates for your programs.</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={isCreating}>
            <Plus className="mr-2 h-4 w-4" /> Create New Template
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-8">
          <div className="grid gap-2 flex-grow min-w-[200px] max-w-sm">
            <Label htmlFor="search-templates">Search Templates</Label>
            <Input
              id="search-templates"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid gap-2 min-w-[150px]">
            <Label htmlFor="status-filter">Filter by Status</Label>
            <Select value={statusFilter} onValueChange={(value: "all" | "draft" | "published") => setStatusFilter(value)}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 min-w-[200px]">
            <div className="grid gap-2 flex-grow">
              <Label htmlFor="sort-by">Sort by</Label>
              <Select value={sortBy} onValueChange={(value: "name" | "updated_at" | "created_at") => setSortBy(value)}>
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Template Name</SelectItem>
                  <SelectItem value="updated_at">Updated Date</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 w-[100px]">
              <Label htmlFor="sort-order">Order</Label>
              <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger id="sort-order">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Asc</SelectItem>
                  <SelectItem value="desc">Desc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <WorkflowTemplatesTable
              workflowTemplates={filteredAndSortedTemplates}
              onUpdateStatus={handleUpdateWorkflowTemplateStatus}
              onDelete={(template) => {
                setSelectedTemplate(template);
                setIsDeleteDialogOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <DeleteWorkflowTemplateDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        workflowTemplateToDelete={selectedTemplate}
        onConfirmDelete={handleDeleteWorkflowTemplate}
      />

      <CreateWorkflowTemplateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        isCreating={isCreating}
        onCreate={handleCreateWorkflowTemplate}
      />
    </>
  );
};

export default WorkflowTemplatesPage;