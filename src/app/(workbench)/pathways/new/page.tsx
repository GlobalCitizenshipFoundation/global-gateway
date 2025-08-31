"use client";

import React, { useState } from "react";
import { PathwayTemplateForm } from "@/features/pathways/components/PathwayTemplateForm";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContextProvider";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // Import Dialog components

export default function CreatePathwayTemplatePage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [isFormOpen, setIsFormOpen] = useState(true); // Control the dialog state

  const handleTemplateSaved = (templateId?: string) => {
    setIsFormOpen(false); // Close dialog
    if (templateId) {
      toast.success("Pathway template created successfully!");
      router.push(`/pathways/${templateId}`); // Redirect to the detail page (builder)
    } else {
      toast.error("Failed to create pathway template.");
      router.push("/pathways");
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false); // Close dialog
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

      <Dialog open={isFormOpen} onOpenChange={handleCancel}> {/* Use handleCancel to close and navigate */}
        <DialogContent className="sm:max-w-[600px] rounded-xl shadow-lg bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-headline-small">Create New Pathway Template</DialogTitle>
          </DialogHeader>
          <PathwayTemplateForm
            onTemplateSaved={handleTemplateSaved}
            onCancel={handleCancel}
            canModify={canModify}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}