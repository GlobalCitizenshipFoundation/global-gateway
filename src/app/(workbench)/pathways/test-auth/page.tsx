import React from "react";
import { createClient } from "@/integrations/supabase/server";
import { redirect } from "next/navigation";
import { getTemplatesAction, getPhasesAction } from "@/features/pathways/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Code, CheckCircle, XCircle, Info } from "lucide-react";

export default async function PathwayAuthTestPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  let userRole: string = "N/A";
  if (user) {
    userRole = user.user_metadata?.role || 'unknown';
  }

  let templatesStatus = "Not fetched";
  let templatesError: string | null = null;
  let templateCount = 0;

  let phasesStatus = "Not fetched";
  let phasesError: string | null = null;
  let phaseCount = 0;

  let testTemplateId: string | null = null;
  let testPhaseId: string | null = null;

  if (user) {
    try {
      const templates = await getTemplatesAction();
      if (templates) {
        templatesStatus = "Fetched successfully";
        templateCount = templates.length;
        if (templates.length > 0) {
          testTemplateId = templates[0].id;
          try {
            const phases = await getPhasesAction(testTemplateId);
            if (phases) {
              phasesStatus = "Fetched successfully for first template";
              phaseCount = phases.length;
              if (phases.length > 0) {
                testPhaseId = phases[0].id;
              }
            }
          } catch (error: any) {
            phasesStatus = "Failed to fetch phases";
            phasesError = error.message;
          }
        }
      }
    } catch (error: any) {
      templatesStatus = "Failed to fetch templates";
      templatesError = error.message;
    }
  } else {
    templatesStatus = "User not authenticated";
    templatesError = userError?.message || "No user session.";
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <h1 className="text-display-small font-bold text-foreground flex items-center gap-2">
        <Code className="h-7 w-7 text-primary" /> Pathway Authorization Test Page
      </h1>
      <p className="text-headline-small text-muted-foreground">
        This page helps diagnose authorization and data fetching for pathway templates and phases.
      </p>

      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-headline-small font-bold text-foreground">User Session Info</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-body-medium">
          <p><strong>User ID:</strong> {user?.id || "N/A"}</p>
          <p><strong>User Email:</strong> {user?.email || "N/A"}</p>
          <p><strong>User Role:</strong> {userRole}</p>
          <p><strong>Authenticated:</strong> {user ? <CheckCircle className="inline h-4 w-4 text-green-600" /> : <XCircle className="inline h-4 w-4 text-red-600" />} {user ? "Yes" : "No"}</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-headline-small font-bold text-foreground">Pathway Templates Fetch Test</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-body-medium">
          <p><strong>Status:</strong> {templatesStatus}</p>
          {templatesError && <p className="text-destructive flex items-center gap-1"><XCircle className="h-4 w-4" /> <strong>Error:</strong> {templatesError}</p>}
          <p><strong>Templates Found:</strong> {templateCount}</p>
          {testTemplateId && <p><strong>First Template ID:</strong> {testTemplateId}</p>}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-headline-small font-bold text-foreground">Phases Fetch Test (for first template)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-body-medium">
          <p><strong>Status:</strong> {phasesStatus}</p>
          {phasesError && <p className="text-destructive flex items-center gap-1"><XCircle className="h-4 w-4" /> <strong>Error:</strong> {phasesError}</p>}
          <p><strong>Phases Found:</strong> {phaseCount}</p>
          {testPhaseId && <p><strong>First Phase ID:</strong> {testPhaseId}</p>}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-headline-small font-bold text-foreground">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-body-medium">
          <p>1. Ensure you are logged in with appropriate permissions (e.g., 'admin' or 'coordinator').</p>
          <p>2. Check the console logs (both browser and server terminal) for detailed authorization messages.</p>
          <p>3. If templates/phases are not fetching, review the RLS policies and Server Action authorization logic.</p>
          <p>4. Proceed to create/edit templates/phases and observe logs.</p>
        </CardContent>
      </Card>
    </div>
  );
}