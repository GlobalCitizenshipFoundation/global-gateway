"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Workflow, Lock, Globe, Copy } from "lucide-react"; // Import Copy icon
import { PathwayTemplate } from "../services/pathway-template-service";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplatesAction, deletePathwayTemplateAction } from "../actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CloneTemplateDialog } from "./CloneTemplateDialog"; // Import CloneTemplateDialog

export function PathwayTemplateList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [templates, setTemplates] = useState<PathwayTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PathwayTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my" | "public">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false); // State for clone dialog
  const [templateToClone, setTemplateToClone] = useState<PathwayTemplate | null>(null); // State for template being cloned

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const fetchedTemplates = await getTemplatesAction();
      if (fetchedTemplates) {
        setTemplates(fetchedTemplates);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load pathway templates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchTemplates();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view pathway templates.");
      setIsLoading(false);
    }
  }, [user, isSessionLoading]);

  useEffect(() => {
    let currentFiltered = templates;

    // Apply search term filter
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply visibility filter
    if (filter === "my" && user) {
      currentFiltered = currentFiltered.filter((template) => template.creator_id === user.id);
    } else if (filter === "public") {
      currentFiltered = currentFiltered.filter((template) => !template.is_private);
    }
    // "all" filter is handled by the initial fetch and search

    setFilteredTemplates(currentFiltered);
  }, [templates, filter, searchTerm, user]);

  const handleDelete = async (id: string) => {
    try {
      const success = await deletePathwayTemplateAction(id);
      if (success) {
        toast.success("Pathway template deleted successfully!");
        fetchTemplates(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete pathway template.");
    }
  };

  const handleClone = (template: PathwayTemplate) => {
    setTemplateToClone(template);
    setIsCloneDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="rounded-xl shadow-md p-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-20 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const userRole: string = user?.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-display-small font-bold text-foreground">Pathway Templates</h1>
        <Button asChild className="rounded-full px-6 py-3 text-label-large">
          <Link href="/pathways/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Template
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search templates by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-md"
        />
        <Select value={filter} onValueChange={(value: "all" | "my" | "public") => setFilter(value)}>
          <SelectTrigger className="w-[180px] rounded-md">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="all" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">All Templates</SelectItem>
            {user && (
              <SelectItem value="my" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">My Templates</SelectItem>
            )}
            <SelectItem value="public" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Public Templates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Pathway Templates Found</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            {searchTerm ? "No templates match your search criteria." : "Start by creating your first pathway template to define your program workflows."}
          </CardDescription>
          {!searchTerm && (
            <Button asChild className="mt-6 rounded-full px-6 py-3 text-label-large">
              <Link href="/pathways/new">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Template Now
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TooltipProvider>
            {filteredTemplates.map((template) => {
              const canEditOrDelete = user && (template.creator_id === user.id || isAdmin);
              return (
                <Card key={template.id} className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-headline-small text-primary flex items-center gap-2">
                      <Workflow className="h-6 w-6" /> {template.name}
                      {template.is_private ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                            Private Template
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                            Public Template
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                    <CardDescription className="text-body-medium text-muted-foreground">
                      {template.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-body-small text-muted-foreground">
                    <p>Created: {new Date(template.created_at).toLocaleDateString()}</p>
                    <p>Last Updated: {new Date(template.updated_at).toLocaleDateString()}</p>
                  </CardContent>
                  <div className="flex justify-end p-4 pt-0 space-x-2">
                    <Button variant="outlined" size="icon" className="rounded-md" onClick={() => handleClone(template)}>
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Clone Template</span>
                    </Button>
                    <Button asChild variant="outlined" size="icon" className="rounded-md">
                      <Link href={`/pathways/${template.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                    {canEditOrDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="rounded-md">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-headline-small">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-body-medium text-muted-foreground">
                              This action cannot be undone. This will permanently delete the &quot;{template.name}&quot; pathway template and all associated phases.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(template.id)}
                              className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </Card>
              );
            })}
          </TooltipProvider>
        </div>
      )}

      {templateToClone && (
        <CloneTemplateDialog
          isOpen={isCloneDialogOpen}
          onClose={() => { setIsCloneDialogOpen(false); setTemplateToClone(null); fetchTemplates(); }}
          templateId={templateToClone.id}
          originalTemplateName={templateToClone.name}
        />
      )}
    </div>
  );
}