"use client"; // Add "use client" directive

import React, { useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { PathwayTemplateForm } from "@/features/pathways/components/PathwayTemplateForm";
import { getTemplateByIdAction } from "@/features/pathways/actions";
import { PathwayTemplate } from "@/features/pathways/services/pathway-template-service";
import { useSession } from "@/context/SessionContextProvider";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface EditPathwayTemplatePageProps {
  params: { id: string }; // Adjusted type for Next.js type checker
}

export default function EditPathwayTemplatePage({ params }: EditPathwayTemplatePageProps) {
  const { id } = params;
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [template, setTemplate] = useState<PathwayTemplate | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoadingTemplate(true);
      // Validate if 'id' is a UUID before proceeding to fetch
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (!isUUID) {
        notFound(); // If it's not a valid UUID, it's a 404
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
        notFound(); // Redirect to 404 or error page
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
    if (templateId) {
      router.push(`/pathways/${templateId}`);
    } else {
      router.push("/pathways");
    }
  };

  const handleCancel = () => {
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
    return null; // notFound() should handle this, but as a fallback
  }

  const canModify = !!user && (template.creator_id === user.id || user.user_metadata?.role === 'admin');

  return (
    <div className="container mx-auto py-8 px-4">
      <PathwayTemplateForm
        initialData={template}
        onTemplateSaved={handleTemplateSaved}
        onCancel={handleCancel}
        canModify={canModify}
      />
    </div>
  );
}