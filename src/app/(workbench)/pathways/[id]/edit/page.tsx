import React from "react";
import { notFound } from "next/navigation";
import { PathwayTemplateForm } from "@/features/pathways/components/PathwayTemplateForm";
import { getTemplateByIdAction } from "@/features/pathways/actions";
import { createClient } from "@/integrations/supabase/server"; // Import createClient

interface EditPathwayTemplatePageProps {
  params: Promise<{ id: string }>; // Adjusted type for Next.js type checker
}

export default async function EditPathwayTemplatePage(props: EditPathwayTemplatePageProps) {
  const { params } = props;
  const resolvedParams = await params; // Await params to resolve proxy
  const { id } = resolvedParams;

  // Validate if 'id' is a UUID before proceeding to fetch
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUUID) {
    notFound(); // If it's not a valid UUID, it's a 404
  }

  const template = await getTemplateByIdAction(id);

  if (!template) {
    notFound(); // This will render the nearest not-found.tsx or the global 404 page
  }

  // Determine if the current user can modify this template
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRole: string = user?.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';
  const canModify = !!user && (template.creator_id === user.id || isAdmin); // Ensure boolean

  return (
    <div className="container mx-auto py-8 px-4">
      <PathwayTemplateForm
        initialData={template}
        onTemplateSaved={() => {}} // Placeholder, actual refresh handled by parent or revalidatePath
        onCancel={() => {}} // Placeholder, actual navigation handled by parent
        canModify={canModify}
      />
    </div>
  );
}