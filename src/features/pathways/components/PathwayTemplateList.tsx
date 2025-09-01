"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Workflow, Lock, Globe, Copy, LayoutGrid, List, CalendarDays, UserCircle2, Clock, Tag, CheckCircle, Archive } from "lucide-react"; // Import Tag icon, CheckCircle, Archive
import { PathwayTemplate } from "@/types/supabase"; // Import from types/supabase
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getTemplatesAction, deletePathwayTemplateAction } from "../actions"; // Changed softDeletePathwayTemplateAction to deletePathwayTemplateAction
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CloneTemplateDialog } from "./CloneTemplateDialog"; // Import CloneTemplateDialog
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Import ToggleGroup
import { PathwayTemplateTable } from "./PathwayTemplateTable"; // Import the new table component
import { Badge } from "@/components/ui/badge"; // Import Badge

// Helper component for Kanban view cards
interface PathwayTemplateCardProps {
  template: PathwayTemplate;
  user: any;
  isAdmin: boolean;
  handleClone: (template: PathwayTemplate) => void;
  handleDelete: (id: string) => void;
}

const PathwayTemplateCard: React.FC<PathwayTemplateCardProps> = ({ template, user, isAdmin, handleClone, handleDelete }) => {
  const canEditOrDelete = user && (template.creator_id === user.id || isAdmin);
  const getProfileDisplayName = (profile: any) => {
    if (!profile) return "Unknown User";
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Unknown User";
  };

  const getStatusBadge = (status: PathwayTemplate['status']) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
      case 'published': return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Published</Badge>;
      case 'archived': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Archive className="h-3 w-3 mr-1" /> Archived</Badge>;
      default: return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">Unknown</Badge>;
    }
  };

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <CardHeader className="flex-grow">
        <CardTitle className="text-headline-small text-primary flex items-center gap-2">
          <Workflow className="h-6 w-6" /> {template.name}
          <TooltipProvider>
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
          </TooltipProvider>
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          {template.description || "No description provided."}
        </CardDescription>
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-label-small bg-muted text-muted-foreground">
                <Tag className="h-3 w-3 mr-1" /> {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="text-body-small text-muted-foreground space-y-1">
        <div className="flex items-center gap-1"> {/* Changed from <p> to <div> */}
          <UserCircle2 className="h-4 w-4" />
          Creator: {getProfileDisplayName(template.creator_profile)}
        </div>
        <div className="flex items-center gap-1"> {/* Changed from <p> to <div> */}
          <CalendarDays className="h-4 w-4" />
          Created: {new Date(template.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1"> {/* Changed from <p> to <div> */}
          <UserCircle2 className="h-4 w-4" />
          Last Updated By: {getProfileDisplayName(template.last_updater_profile)}
        </div>
        <div className="flex items-center gap-1"> {/* Changed from <p> to <div> */}
          <CalendarDays className="h-4 w-4" />
          Last Updated: {new Date(template.updated_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1"> {/* Changed from <p> to <div> */}
          {getStatusBadge(template.status)}
        </div>
      </CardContent>
      <div className="flex justify-end p-4 pt-0 space-x-2">
        <Button variant="outline" size="icon" className="rounded-md" onClick={() => handleClone(template)}>
          <Copy className="h-4 w-4" />
          <span className="sr-only">Clone Template</span>
        </Button>
        <Button asChild variant="outline" size="icon" className="rounded-md">
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
};


export function PathwayTemplateList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [templates, setTemplates] = useState<PathwayTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PathwayTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my" | "public">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState(""); // New state for tag filter
  const [sortBy, setSortBy] = useState<string>("created_at_desc"); // Default sort
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban"); // New state for view mode
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
    let currentFiltered = [...templates]; // Create a mutable copy

    // Apply search term filter
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply tag filter
    if (tagFilter) {
      const lowerCaseTagFilter = tagFilter.toLowerCase();
      currentFiltered = currentFiltered.filter(
        (template) => template.tags?.some(tag => tag.toLowerCase().includes(lowerCaseTagFilter))
      );
    }

    // Apply visibility filter
    if (filter === "my" && user) {
      currentFiltered = currentFiltered.filter((template) => template.creator_id === user.id);
    } else if (filter === "public") {
      currentFiltered = currentFiltered.filter((template) => !template.is_private);
    }
    // "all" filter is handled by the initial fetch and search

    // Apply sorting
    currentFiltered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "created_at_asc": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "created_at_desc": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "updated_at_asc": return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case "updated_at_desc": return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "status_asc": return a.status.localeCompare(b.status);
        case "status_desc": return b.status.localeCompare(a.status);
        default: return 0;
      }
    });

    setFilteredTemplates(currentFiltered);
  }, [templates, filter, searchTerm, tagFilter, sortBy, user]);

  const handleDelete = async (id: string) => {
    try {
      const success = await deletePathwayTemplateAction(id); // Use deletePathwayTemplateAction
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
          placeholder="Search templates by name, description, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-md"
        />
        <Input
          placeholder="Filter by tag..."
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="w-[180px] rounded-md"
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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px] rounded-md">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="name_asc" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Name (Z-A)</SelectItem>
            <SelectItem value="created_at_desc" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Created Date (Newest)</SelectItem>
            <SelectItem value="created_at_asc" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Created Date (Oldest)</SelectItem>
            <SelectItem value="updated_at_desc" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Last Updated (Newest)</SelectItem>
            <SelectItem value="updated_at_asc" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Last Updated (Oldest)</SelectItem>
            <SelectItem value="status_asc" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Status (A-Z)</SelectItem>
            <SelectItem value="status_desc" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Status (Z-A)</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup type="single" value={viewMode} onValueChange={(value: "kanban" | "table") => value && setViewMode(value)} className="rounded-md bg-muted p-1">
          <ToggleGroupItem value="kanban" aria-label="Toggle Kanban view" className="rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <LayoutGrid className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Toggle Table view" className="rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
            <List className="h-5 w-5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Pathway Templates Found</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            {searchTerm || tagFilter || filter !== "all"
              ? "No templates match your current filters."
              : "Start by creating your first pathway template to define your program workflows."}
          </CardDescription>
          {!searchTerm && !tagFilter && filter === "all" && (
            <Button asChild className="mt-6 rounded-full px-6 py-3 text-label-large">
              <Link href="/pathways/new">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Template Now
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        viewMode === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TooltipProvider>
              {filteredTemplates.map((template) => (
                <PathwayTemplateCard
                  key={template.id}
                  template={template}
                  user={user}
                  isAdmin={isAdmin}
                  handleClone={handleClone}
                  handleDelete={handleDelete}
                />
              ))}
            </TooltipProvider>
          </div>
        ) : (
          <PathwayTemplateTable
            templates={filteredTemplates}
            user={user}
            isAdmin={isAdmin}
            handleClone={handleClone}
            handleDelete={handleDelete}
            fetchTemplates={fetchTemplates} // Pass fetchTemplates for revalidation
          />
        )
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