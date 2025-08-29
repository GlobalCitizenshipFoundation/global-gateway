"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Workflow } from "lucide-react";
import { PathwayTemplate, pathwayTemplateService } from "../services/pathway-template-service";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";

// This comment is added to ensure the file is re-processed by the build system.
export function PathwayTemplateList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [templates, setTemplates] = useState<PathwayTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const fetchedTemplates = await pathwayTemplateService.getPathwayTemplates();
    if (fetchedTemplates) {
      setTemplates(fetchedTemplates);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchTemplates();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view pathway templates.");
      setIsLoading(false);
    }
  }, [user, isSessionLoading]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this pathway template and all its phases?")) {
      const success = await pathwayTemplateService.deletePathwayTemplate(id);
      if (success) {
        fetchTemplates(); // Refresh the list
      }
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-display-small font-bold text-foreground">Pathway Templates</h1>
        <Button asChild className="rounded-full px-6 py-3 text-label-large">
          <Link href="/workbench/pathway-templates/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Template
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Pathway Templates Found</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            Start by creating your first pathway template to define your program workflows.
          </CardDescription>
          <Button asChild className="mt-6 rounded-full px-6 py-3 text-label-large">
            <Link href="/workbench/pathway-templates/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Template Now
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <CardHeader className="flex-grow">
                <CardTitle className="text-headline-small text-primary flex items-center gap-2">
                  <Workflow className="h-6 w-6" /> {template.name}
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
                <Button asChild variant="outline" size="icon" className="rounded-md">
                  <Link href={`/workbench/pathway-templates/${template.id}`}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Link>
                </Button>
                <Button variant="destructive" size="icon" className="rounded-md" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}