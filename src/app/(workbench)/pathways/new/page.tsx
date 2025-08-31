import React from "react";
import { PathwayTemplateForm } from "@/features/pathways/components/PathwayTemplateForm";
import { createPathwayTemplateAction } from "@/features/pathways/actions"; // Import createPathwayTemplateAction
import { redirect } from "next/navigation"; // Import redirect
import { createClient } from "@/integrations/supabase/server"; // Import createClient
import { toast } from "sonner"; // Import toast

export default async function CreatePathwayTemplatePage() {
  // Determine if the current user can create templates (assuming any authenticated user can create)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const canModify = !!user; // Authenticated users can create

  // This page is for creating a new template. The form will handle submission.
  // The PathwayTemplateForm component itself doesn't directly create, but calls an action.
  // For creation, we'll provide a dummy onTemplateSaved and onCancel, as the form will redirect.

  const handleCreate = async (formData: FormData) => {
    "use server";
    try {
      const newTemplate = await createPathwayTemplateAction(formData);
      if (newTemplate) {
        // Redirect to the new template's detail page after creation
        redirect(`/pathways/${newTemplate.id}`);
      }
    } catch (error: any) {
      console.error("Error creating pathway template:", error);
      // This error will be caught by the client-side form and displayed as a toast
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <PathwayTemplateForm
        onTemplateSaved={() => {}} // No direct client-side save action needed here, form redirects
        onCancel={() => redirect('/pathways')} // Redirect back to list on cancel
        canModify={canModify}
      />
    </div>
  );
}