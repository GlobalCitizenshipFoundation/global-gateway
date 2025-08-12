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
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Plus, FileText, LayoutTemplate } from "lucide-react"; // Added LayoutTemplate icon
import { showError, showSuccess } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FormManagementPage = () => {
  const { user } = useSession();
  const [forms, setForms] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);

  const [isNewFormDialogOpen, setIsNewFormDialogOpen] = useState(false); // Combined dialog
  const [templates, setTemplates] = useState<FormType[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newFormName, setNewFormName] = useState('');
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [newFormDescription, setNewFormDescription] = useState<string | null>(null); // For new form description

  const [filterType, setFilterType] = useState<'all' | 'template' | 'program'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const filteredAndSortedForms = useMemo(() => {
    let currentForms = [...forms];

    // Filter
    if (filterType === 'template') {
      currentForms = currentForms.filter(f => f.is_template);
    } else if (filterType === 'program') {
      currentForms = currentForms.filter(f => !f.is_template);
    }

    // Sort
    currentForms.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'name') {
        compareValue = a.name.localeCompare(b.name);
      } else if (sortBy === 'created_at') {
        compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'updated_at') {
        compareValue = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return currentForms;
  }, [forms, filterType, sortBy, sortOrder]);

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

  const handleCreateForm = async () => {
    if (!user) {
      showError("You must be logged in to create a form.");
      return;
    }
    if (!newFormName.trim()) {
      showError("New form name cannot be empty.");
      return;
    }

    setIsCreatingForm(true);

    try {
      if (selectedTemplateId) {
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) {
          showError("Selected template not found.");
          setIsCreatingForm(false);
          return;
        }
        setNewFormDescription(template.description); // Set description from template

        // Call the Edge Function to copy the template
        const { data, error: invokeError } = await supabase.functions.invoke('copy-form-template', {
          body: JSON.stringify({
            templateFormId: selectedTemplateId,
            newFormName: newFormName,
            newFormDescription: template.description,
            userId: user.id,
            isTemplate: false, // New form is not a template
          }),
        });

        if (invokeError) {
          throw new Error(`Edge function error: ${invokeError.message}`);
        }
        if (data.error) {
          throw new Error(`Failed to create form from template: ${data.error}`);
        }
        const newFormId = data.newFormId;
        showSuccess("Form created from template successfully! Redirecting to form builder.");
        // Add the new form to local state for immediate display
        setForms(prev => [...prev, { id: newFormId, user_id: user.id, name: newFormName, is_template: false, status: 'draft', description: template.description, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
        setIsNewFormDialogOpen(false);
        window.location.href = `/creator/forms/${newFormId}/edit`; // Full refresh to ensure form builder loads correctly

      } else {
        // Create a new blank form directly via Supabase client
        const { data: newFormData, error: formError } = await supabase.from("forms").insert({
          user_id: user.id,
          name: newFormName,
          is_template: false,
          status: 'draft',
          description: null, // Blank form has no description initially
        }).select('id').single();

        if (formError || !newFormData) {
          throw new Error(`Failed to create blank form: ${formError?.message}`);
        }
        showSuccess("Blank form created successfully! Redirecting to form builder.");
        // Add the new form to local state for immediate display
        setForms(prev => [...prev, { ...newFormData, user_id: user.id, name: newFormName, is_template: false, status: 'draft', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
        setIsNewFormDialogOpen(false);
        window.location.href = `/creator/forms/${newFormData.id}/edit`; // Full refresh
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsCreatingForm(false);
    }
  };

  return (
    <>
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Forms & Templates</h1>
            <p className="text-muted-foreground">Oversee all your custom forms and templates.</p>
          </div>
          <Button onClick={() => {
            setIsNewFormDialogOpen(true);
            setNewFormName('');
            setSelectedTemplateId(null);
          }} disabled={isCreatingForm}>
            <Plus className="mr-2 h-4 w-4" /> New Form
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-2">
                <Label htmlFor="filter-type">Show:</Label>
                <Select value={filterType} onValueChange={(value) => setFilterType(value as typeof filterType)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Forms</SelectItem>
                    <SelectItem value="program">Program Forms</SelectItem>
                    <SelectItem value="template">Templates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sort-by">Sort by:</Label>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="updated_at">Last Modified</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? '▲' : '▼'}
                </Button>
              </div>
            </div>
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-destructive">Error: {error}</TableCell>
                  </TableRow>
                ) : filteredAndSortedForms.length > 0 ? filteredAndSortedForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {form.is_template ? <LayoutTemplate className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {form.is_template ? 'Template' : 'Program Form'}
                      </Badge>
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
                          {!form.is_template && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedTemplateId(form.id);
                              setNewFormName(`${form.name} Copy`);
                              setIsNewFormDialogOpen(true);
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
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground text-sm">
                          You haven't created any forms or templates yet.
                        </p>
                        <p className="text-muted-foreground text-sm mt-1">
                          Click "New Form" to get started!
                        </p>
                      </div>
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

      {/* New Form Dialog (combines blank and template creation) */}
      <Dialog open={isNewFormDialogOpen} onOpenChange={setIsNewFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
            <DialogDescription>
              Start with a blank form or choose an existing template.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-form-name">New Form Name</Label>
              <Input
                id="new-form-name"
                placeholder="e.g., My New Program Application"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                disabled={isCreatingForm}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-select">Select Template (Optional)</Label>
              <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId} disabled={isCreatingForm}>
                <SelectTrigger id="template-select">
                  <SelectValue placeholder="Start from scratch (blank form)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Start from scratch (blank form)</SelectItem>
                  {templates.length > 0 && <DropdownMenuSeparator />}
                  {templates.length > 0 ? (
                    templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-templates" disabled>No templates available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFormDialogOpen(false)} disabled={isCreatingForm}>Cancel</Button>
            <Button onClick={handleCreateForm} disabled={!newFormName.trim() || isCreatingForm}>
              {isCreatingForm ? 'Creating...' : 'Create Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormManagementPage;