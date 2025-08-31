"use client";

import React from "react";
import { PathwayTemplateForm } from "@/features/pathways/components/PathwayTemplateForm";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContextProvider";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreatePathwayTemplatePage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();

  const handleTemplateSaved = (templateId?: string) => {
    if (templateId) {
      toast.success("Pathway template created successfully!");
      router.push(`/pathways/${templateId}`); // Redirect to the detail page (builder)
    } else {
      toast.error("Failed to create pathway template.");
      router.push("/pathways");
    }
  };

  const handleCancel = () => {
    router.push("/pathways");
  };

  if (isSessionLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const canModify = !!user; // Only authenticated users can create templates

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href="/pathways">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Templates
          </Link>
        </Button>
      </div>
      <h1 className="text-display-small font-bold text-foreground">Create New Pathway Template</h1>
      <PathwayTemplateForm
        onTemplateSaved={handleTemplateSaved}
        onCancel={handleCancel}
        canModify={canModify}
      />
    </div>
  );
}