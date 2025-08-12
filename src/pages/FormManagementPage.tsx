import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

import { useFormsData } from "@/hooks/useFormsData";
import { useFormManagementActions } from "@/hooks/useFormManagementActions";
import { FormsTable } from "@/components/forms/FormsTable.tsx";
import { DeleteFormDialog } from "@/components/forms/DeleteFormDialog.tsx";
import { CreateFormFromTemplateDialog } from "@/components/forms/CreateFormFromTemplateDialog.tsx";
import { SaveAsTemplateDialog } from "@/components/forms/SaveAsTemplateDialog.tsx";
import { Skeleton } from "@/components/ui/skeleton";

const FormManagementPage = () => {
  const { forms, setForms, templates, setTemplates, loading, error } = useFormsData();
  const {
    isDeleteDialogOpen, setIsDeleteDialogOpen, selectedForm, setSelectedForm, handleDeleteForm,
    isCreateFromTemplateDialogOpen, setIsCreateFromTemplateDialogOpen, selectedTemplateId, setSelectedTemplateId, newFormName, setNewFormName, isCreatingForm, handleCreateBlankForm, handleCreateFormFromTemplate,
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen, templateFormToCopy, setTemplateFormToCopy, newTemplateName, setNewTemplateName, isSavingTemplate, handleSaveAsTemplate,
    handleUpdateFormStatus,
  } = useFormManagementActions({ setForms, setTemplates, templates });

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
        <Card>
          <CardContent className="p-0">
            <FormsTable
              forms={forms}
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