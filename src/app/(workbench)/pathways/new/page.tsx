"use client"; // Add "use client" directive

import React from "react";
import { PathwayTemplateForm } from "@/features/pathways/components/PathwayTemplateForm";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContextProvider";
import { toast } from "sonner";

export default function CreatePathwayTemplatePage() {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();

  const handleTemplateSaved = (templateId?: string) => {
    if (templateId) {
      router.push(`/pathways/${templateId}`);
    } else {
      router.push("/pathways");
    }
  };

  const handleCancel = () => {
    router.push("/pathways");
  };

  if (isSessionLoading) {
    return <div className="container mx-auto py-8 px-4 text-center text-foreground">Loading...</div>;
  }

  const canModify = !!user; // Only authenticated users can create templates

  return (
    <div className="container mx-auto py-8 px-4">
      <PathwayTemplateForm
        onTemplateSaved={handleTemplateSaved}
        onCancel={handleCancel}
        canModify={canModify}
      />
    </div>
  );
}