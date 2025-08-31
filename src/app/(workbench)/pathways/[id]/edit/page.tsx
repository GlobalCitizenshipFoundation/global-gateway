"use client";

import React, { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { PathwayTemplateForm } from "@/features/pathways/components/PathwayTemplateForm";
import { getTemplateByIdAction } from "@/features/pathways/actions";
import { PathwayTemplate } from "@/features/pathways/services/pathway-template-service";
import { useSession } from "@/context/SessionContextProvider";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Import Dialog components

interface EditPathwayTemplatePageProps {
  params: { id: string };
}

export default function EditPathwayTemplatePage({ params }: EditPathwayTemplatePageProps) {
  const { id } = params;
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [template, setTemplate] = useState<PathwayTemplate | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(true); // Control the dialog state

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoadingTemplate(true);
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUUID) {
        notFound();
        return;
      }

      try {
        const fetchedTemplate = await getTemplateByIdAction(id);
        if (!fetchedTemplate) {
          notFound();
          return;
        }
        setTemplate(fetchedTemplate);
      } catch (error: any) {
        console.error("Error fetching template for edit:", error);
        toast.error(error.message || "Failed to load template for editing.");
        notFound();
      } finally {
        setIsLoadingTemplate(false);
      }
    };

    if (!isSessionLoading && user) {
      fetchTemplate();
    } else if (!isSessionLoading && !user) {
      router.push("/login");
    }
  }, [id, user, isSessionLoading, router]);

  const handleTemplateSaved = (templateId?: string) => {
    setIsFormOpen(false); // Close dialog
    if (templateId) {
      toast.success("Pathway template updated successfully!");
      router.push(`/pathways/${templateId}`); // Redirect to the detail page (builder)
    } else {
      toast.error("Failed to update pathway template.");
      router.push(`/pathways/${id}`);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false); // Close dialog
    router.push(`/pathways/${id}`);
  };

  if (isLoadingTemplate || isSessionLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!template) {
    return null;
  }

  const canModify = !!user && (template.creator_id === user.id || user.user_metadata?.role === 'admin');

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href={`/pathways/${id}`}>
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Template Details
          </Link>
        </Button>
      </div>
      <h1 className="text-display-small font-bold text-foreground">Edit Pathway Template</h1>

      <Dialog open={isFormOpen} onOpenChange={handleCancel}> {/* Use handleCancel to close and navigate */}
        <DialogContent className="sm:max-w-[600px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-headline-small">Edit Pathway Template</DialogTitle>
          </DialogHeader>
          <PathwayTemplateForm
            initialData={template}
            onTemplateSaved={handleTemplateSaved}
            onCancel={handleCancel}
            canModify={canModify}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}