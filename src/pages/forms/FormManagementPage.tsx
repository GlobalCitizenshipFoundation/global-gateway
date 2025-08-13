import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

import { useFormsData } from "@/hooks/forms/useFormsData";
import { useFormManagementActions } from "@/hooks/forms/useFormManagementActions";
import { FormsTable } from "@/components/forms/FormsTable";
import { DeleteFormDialog } from "@/components/forms/DeleteFormDialog";
import { CreateFormFromTemplateDialog } from "@/components/forms/CreateFormFromTemplateDialog";
import { SaveAsTemplateDialog } from "@/components/forms/SaveAsTemplateDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react"; // Import useMemo
import { Form as FormType } from "@/types";
import { Input } from "@/components/ui/input"; // Import Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

const FormManagementPage = () => {
  const { forms, setForms, templates, setTemplates, loading, error } = useFormsData();
  const {
    isDeleteDialogOpen, setIsDeleteDialogOpen, selectedForm, setSelectedForm, handleDeleteForm,
    isCreateFromTemplateDialogOpen, setIsCreateFromTemplateDialogOpen, selectedTemplateId, setSelectedTemplateId, newFormName, setNewFormName, isCreatingForm, handleCreateBlankForm, handleCreateFormFromTemplate,
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen, templateFormToCopy, setTemplateFormToCopy, newTemplateName, setNewTemplateName, isSavingTemplate, handleSaveAsTemplate,
    handleUpdateFormStatus,
  } = useFormManagementActions({ setForms, setTemplates, templates });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'form' | 'template'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const openCreateFromTemplateDialog = () => {
    setSelectedTemplateId(null);
    setNewFormName('');
    setIsCreateFromTemplateDialogOpen(true);
  };

  const filteredAndSortedForms = useMemo(() => {
    let filtered = forms.filter(form => {
      const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' ||
                          (filterType === 'form' && !form.is_template) ||
                          (filterType === 'template' && form.is_template);
      return matchesSearch && matchesType;
    });

    filtered.sort((a, b) => {
      let compareA: any;
      let compareB: any;

      if (sortBy === 'name') {
        compareA = a.name.toLowerCase();
        compareB = b.name.toLowerCase();
      } else if (sortBy === 'created_at') {
        compareA = new Date(a.created_at).getTime();
        compareB = new Date(b.created_at).getTime();
      } else { // updated_at
        compareA = new Date(a.last_edited_at || a.updated_at).getTime();
        compareB = new Date(b.last_edited_at || b.updated_at).getTime();
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [forms, searchTerm, filterType, sortBy, sortOrder]);

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
            <h1 className="text-3xl font-bold">Manage Forms</h1>
            <p className="text-muted-foreground">Oversee all forms and templates.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateBlankForm} disabled={isCreatingForm}>
              <Plus className="mr-2 h-4 w-4" /> Create Blank Form
            </Button>
            <Button variant="outline" onClick={openCreateFromTemplateDialog} disabled={templates.length === 0 || isCreatingForm}>
              Create from Template
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input
            placeholder="Search forms by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select value={filterType} onValueChange={(value: 'all' | 'form' | 'template') => setFilterType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="form">Forms</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: 'name' | 'created_at' | 'updated_at') => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="updated_at">Last Modified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
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