import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form as FormType } from "@/types";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Plus } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Import Label

const FormManagementPage = () => {
  const { user } = useSession();
  const [forms, setForms] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);

  const [isCreateFromTemplateDialogOpen, setIsCreateFromTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<FormType[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newFormName, setNewFormName] = useState('');
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        console.error("Error fetching forms:", error);
      } else {
        setForms(data as FormType[]);
        setTemplates(data.filter(f => f.is_template) as FormType[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleDeleteForm = async () => {
    if (!selectedForm) return;

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', selectedForm.id);

    if (error) {
      showError(`Failed to delete form: ${error.message}`);
    } else {
      showSuccess(`Form "${selectedForm.name}" deleted successfully.`);
      setForms(forms.filter(f => f.id !== selectedForm.id));
      setTemplates(templates.filter(t => t.id !== selectedForm.id));
    }
    setSelectedForm(null);
    setIsDeleteDialogOpen(false);
  };

  const handleUpdateFormStatus = async (formId: string, newStatus: 'draft' | 'published') => {
    const originalForms = [...forms];
    // Optimistic update
    setForms(prev => prev.map(f => f.id === formId ? { ...f, status: newStatus, updated_at: new Date().toISOString() } : f));

    const { error } = await supabase
      .from('forms')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', formId);

    if (error) {
      showError(`Failed to update form status: ${error.message}. Reverting.`);
      setForms(originalForms); // Revert on error
    } else {
      showSuccess(`Form status updated to "${newStatus}".`);
    }
  };

  const handleCreateBlankForm = async () => {
    if (!user) {
      showError("You must be logged in to create a form.");
      return;
    }
    setIsCreatingForm(true);
    const { data: newFormData, error: formError } = await supabase.from("forms").insert({
      user_id: user.id, // Include user_id
      name: "New Blank Form",
      is_template: false,
      status: 'draft',
      description: null, // Include description
    }).select('id').single();

    if (formError || !newFormData) {
      showError(`Failed to create blank form: ${formError?.message}`);
    } else {
      showSuccess("Blank form created successfully! Redirecting to form builder.");
      setForms(prev => [...prev, { ...newFormData, user_id: user.id, name: "New Blank Form", is_template: false, status: 'draft', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
      window.location.href = `/creator/forms/${newFormData.id}/edit`; // Full refresh to ensure form builder loads correctly
    }
    setIsCreatingForm(false);
  };

  const handleCreateFormFromTemplate = async () => {
    if (!user || !selectedTemplateId || !newFormName.trim()) {
      showError("Please select a template and provide a name for the new form.");
      return;
    }
    setIsCreatingForm(true);

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      showError("Selected template not found.");
      setIsCreatingForm(false);
      return;
    }

    // 1. Create the new form entry
    const { data: newFormData, error: newFormError } = await supabase.from("forms").insert({
      user_id: user.id, // Include user_id
      name: newFormName,
      is_template: false, // New form is not a template by default
      status: 'draft',
      description: null, // Include description
    }).select('id').single();

    if (newFormError || !newFormData) {
      showError(`Failed to create new form: ${newFormError?.message}`);
      setIsCreatingForm(false);
      return;
    }

    // 2. Fetch sections and fields from the template
    const { data: templateSections, error: sectionsError } = await supabase
      .from('form_sections')
      .select('*')
      .eq('form_id', selectedTemplateId)
      .order('order', { ascending: true });

    const { data: templateFields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', selectedTemplateId)
      .order('order', { ascending: true });

    if (sectionsError || fieldsError) {
      showError(`Failed to load template content: ${sectionsError?.message || fieldsError?.message}`);
      await supabase.from('forms').delete().eq('id', newFormData.id); // Rollback
      setIsCreatingForm(false);
      return;
    }

    const oldSectionIdMap = new Map<string, string>();
    const newSectionsToInsert = templateSections.map(section => {
      const newSectionId = crypto.randomUUID();
      oldSectionIdMap.set(section.id, newSectionId);
      return {
        id: newSectionId,
        form_id: newFormData.id,
        name: section.name,
        order: section.order,
      };
    });

    const newFieldsToInsert = templateFields.map(field => ({
      id: crypto.randomUUID(),
      form_id: newFormData.id,
      section_id: field.section_id ? oldSectionIdMap.get(field.section_id) : null,
      label: field.label,
      field_type: field.field_type,
      options: field.options,
      is_required: field.is_required,
      order: field.order,
      display_rules: field.display_rules,
      help_text: field.help_text,
      description: field.description,
      tooltip: field.tooltip,
    }));

    // 3. Insert new sections and fields
    const { error: insertSectionsError } = await supabase.from('form_sections').insert(newSectionsToInsert);
    const { error: insertFieldsError } = await supabase.from('form_fields').insert(newFieldsToInsert);

    if (insertSectionsError || insertFieldsError) {
      showError(`Failed to copy template content: ${insertSectionsError?.message || insertFieldsError?.message}`);
      await supabase.from('forms').delete().eq('id', newFormData.id); // Rollback
      setIsCreatingForm(false);
      return;
    }

    showSuccess("Form created from template successfully! Redirecting to form builder.");
    setForms(prev => [...prev, { ...newFormData, user_id: user.id, name: newFormName, is_template: false, status: 'draft', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
    setIsCreateFromTemplateDialogOpen(false);
    window.location.href = `/creator/forms/${newFormData.id}/edit`; // Full refresh
    setIsCreatingForm(false);
  };

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                  <TableHead className="hidden xl:table-cell">Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.length > 0 ? forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{form.is_template ? 'Template' : 'Program Form'}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
                        {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {new Date(form.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {new Date(form.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/creator/forms/${form.id}/edit`}>Edit Form</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Status</DropdownMenuLabel>
                          {form.status === 'draft' ? (
                            <DropdownMenuItem onClick={() => handleUpdateFormStatus(form.id, 'published')}>
                              Publish
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleUpdateFormStatus(form.id, 'draft')}>
                              Unpublish (Set to Draft)
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {!form.is_template && ( // Only show "Save as Template" for non-template forms
                            <DropdownMenuItem onClick={() => {
                              setSelectedForm(form);
                              // This will be handled by FormBuilderPage's save as template logic
                              window.location.href = `/creator/forms/${form.id}/edit?saveAsTemplate=true`;
                            }}>
                              Save as Template
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setSelectedForm(form);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            Delete Form
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      You haven't created any forms or templates yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the form
              <span className="font-semibold"> "{selectedForm?.name}" </span>
              and all of its associated sections and fields. If this form is linked to a program, that program will no longer have an application form.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedForm(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteForm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create from Template Dialog */}
      <Dialog open={isCreateFromTemplateDialogOpen} onOpenChange={setIsCreateFromTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Form from Template</DialogTitle>
            <DialogDescription>
              Select an existing template and provide a name for your new form.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-select">Select Template</Label>
              <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.length === 0 ? (
                    <SelectItem value="no-templates" disabled>No templates available</SelectItem>
                  ) : (
                    templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-form-name">New Form Name</Label>
              <Input
                id="new-form-name"
                placeholder="e.g., My New Program Application"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFromTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFormFromTemplate} disabled={!selectedTemplateId || !newFormName.trim() || isCreatingForm}>
              {isCreatingForm ? 'Creating...' : 'Create Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormManagementPage;