"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Mail, MessageSquare, Smartphone, Lock, Globe } from "lucide-react";
import { CommunicationTemplate, getCommunicationTemplatesAction, deleteCommunicationTemplateAction } from "@/features/communications"; // Updated import to barrel file
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function CommunicationTemplateList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CommunicationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my" | "public">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const fetchedTemplates = await getCommunicationTemplatesAction();
      if (fetchedTemplates) {
        setTemplates(fetchedTemplates);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load communication templates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchTemplates();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view communication templates.");
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
          template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.body.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      currentFiltered = currentFiltered.filter((template) => template.type === typeFilter);
    }

    // Apply visibility filter
    if (filter === "my" && user) {
      currentFiltered = currentFiltered.filter((template) => template.creator_id === user.id);
    } else if (filter === "public") {
      currentFiltered = currentFiltered.filter((template) => template.is_public);
    }

    setFilteredTemplates(currentFiltered);
  }, [templates, filter, searchTerm, typeFilter, user]);

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteCommunicationTemplateAction(id);
      if (success) {
        toast.success("Communication template deleted successfully!");
        fetchTemplates(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete communication template.");
    }
  };

  const getTemplateIcon = (type: CommunicationTemplate['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-6 w-6" />;
      case 'in-app': return <MessageSquare className="h-6 w-6" />;
      case 'sms': return <Smartphone className="h-6 w-6" />;
      default: return <Mail className="h-6 w-6" />;
    }
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
        <h1 className="text-display-small font-bold text-foreground">Communication Templates</h1>
        <Button asChild className="rounded-full px-6 py-3 text-label-large">
          <Link href="/workbench/communications/templates/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Template
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search templates by name, subject, or body..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-md"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] rounded-md">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="all" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">All Types</SelectItem>
            <SelectItem value="email" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Email</SelectItem>
            <SelectItem value="in-app" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">In-App Notification</SelectItem>
            <SelectItem value="sms" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">SMS</SelectItem>
          </SelectContent>
        </Select>
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
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Communication Templates Found</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            {searchTerm || typeFilter !== "all" || filter !== "all"
              ? "No templates match your current filters."
              : "Start by creating your first communication template to standardize your messages."}
          </CardDescription>
          {!searchTerm && typeFilter === "all" && filter === "all" && (
            <Button asChild className="mt-6 rounded-full px-6 py-3 text-label-large">
              <Link href="/workbench/communications/templates/new">
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
                      {getTemplateIcon(template.type)} {template.name}
                      {template.is_public ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                            Public Template
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                            Private Template
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                    <CardDescription className="text-body-medium text-muted-foreground">
                      Subject: {template.subject}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-body-small text-muted-foreground">
                    <p className="line-clamp-3">{template.body}</p>
                    <p className="mt-2">Type: <span className="font-medium capitalize">{template.type}</span></p>
                    <p>Created: {new Date(template.created_at).toLocaleDateString()}</p>
                    <p>Last Updated: {new Date(template.updated_at).toLocaleDateString()}</p>
                  </CardContent>
                  <div className="flex justify-end p-4 pt-0 space-x-2">
                    <Button asChild variant="outlined" size="icon" className="rounded-md">
                      <Link href={`/workbench/communications/templates/${template.id}/edit`}>
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
                              This action cannot be undone. This will permanently delete the &quot;{template.name}&quot; communication template.
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
    </div>
  );
}