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
import { MoreHorizontal } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";

const FormManagementPage = () => {
  const { user } = useSession();
  const [forms, setForms] = useState<FormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);

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
          <Button asChild>
            <Link to="/creator/new-program">Create New Program (with new form)</Link>
          </Button>
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
    </>
  );
};

export default FormManagementPage;