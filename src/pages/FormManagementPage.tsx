import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useFormsData } from "@/hooks/useFormsData";
import { useFormManagementActions } from "@/hooks/useFormManagementActions";
import { FormsTable } from "@/components/forms/FormsTable";
import { DeleteFormDialog } from "@/components/forms/DeleteFormDialog";
import { CreateFormFromTemplateDialog } from "@/components/forms/CreateFormFromTemplateDialog";
import { SaveAsTemplateDialog } from "@/components/forms/SaveAsTemplateDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { Form as FormType } from "@/types";

const FormManagementPage = () => {
  const { forms, setForms, templates, setTemplates, loading, error } = useFormsData();
  const {
    isDeleteDialogOpen, setIsDeleteDialogOpen, selectedForm, setSelectedForm, handleDeleteForm,
    isCreateFromTemplateDialogOpen, setIsCreateFromTemplateDialogOpen, selectedTemplateId, setSelectedTemplateId, newFormName, setNewFormName, isCreatingForm, handleCreateBlankForm, handleCreateFormFromTemplate,
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen, templateFormToCopy, setTemplateFormToCopy, newTemplateName, setNewTemplateName, isSavingTemplate, handleSaveAsTemplate,
    handleUpdateFormStatus,
  } = useFormManagementActions({ setForms, setTemplates, templates });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "template" | "program_form">("all");
  const [sortBy, setSortBy] = useState<"name" | "updated_at" | "created_at">("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredAndSortedForms = useMemo(() => {
    let displayForms = [...forms];

    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      displayForms = displayForms.filter(
        (form) =>
          form.name.toLowerCase().includes(lowerCaseSearch) ||
          (form.description && form.description.toLowerCase().includes(lowerCaseSearch))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      displayForms = displayForms.filter((form) => form.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter === "template") {
      displayForms = displayForms.filter((form) => form.is_template);
    } else if (typeFilter === "program_form") {
      displayForms = displayForms.filter((form) => !form.is_template);
    }

    // Apply sorting
    displayForms.sort((a, b) => {
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

    return displayForms;
  }, [forms, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

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
            <h1 className="text-3xl font-bold">Manage Forms & Templates</h1>
            <p className="text-muted-foreground">Oversee all your custom forms and templates.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateBlankForm} disabled={isCreatingForm}>
              <Plus className="mr-2 h-4 w-4" /> Create Blank Form
            </Button>
            <Button variant="outline" onClick={() => setIsCreateFromTemplateDialogOpen(true)} disabled={templates.length === 0 || isCreatingForm}>
              Create from Template
            </Button>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Input
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="col-span-full lg:col-span-1"
          />
          <Select value={statusFilter} onValueChange={(value: "all" | "draft" | "published") => setStatusFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(value: "all" | "template" | "program_form") => setTypeFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="program_form">Program Forms</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: "name" | "updated_at" | "created_at") => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Form Name</SelectItem>
                <SelectItem value="updated_at">Updated Date</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Asc</SelectItem>
                <SelectItem value="desc">Desc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <FormsTable
              forms={filteredAndSortedForms}
              onUpdateStatus={handleUpdateFormStatus}
              onSaveAsTemplate={(form) => {
                setTemplateFormToCopy(form);
                setNewTemplateName(`${form.name} Template`);
                setIsSaveAsTemplateDialogOpen(true);
              }}
              onDelete={(form) => {
                setSelectedForm(form);
                setIsDeleteDialogOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <DeleteFormDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        formToDelete={selectedForm}
        onConfirmDelete={handleDeleteForm}
      />

      <CreateFormFromTemplateDialog
        isOpen={isCreateFromTemplateDialogOpen}
        onClose={() => setIsCreateFromTemplateDialogOpen(false)}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        newFormName={newFormName}
        setNewFormName={setNewFormName}
        isCreating={isCreatingForm}
        onCreate={handleCreateFormFromTemplate}
      />

      <SaveAsTemplateDialog
        isOpen={isSaveAsTemplateDialogOpen}
        onClose={() => setIsSaveAsTemplateDialogOpen(false)}
        formToCopy={templateFormToCopy}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        isSaving={isSavingTemplate}
        onSave={handleSaveAsTemplate}
      />
    </>
  );
};

export default FormManagementPage;