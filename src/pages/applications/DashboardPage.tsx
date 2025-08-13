import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Application as UserApplication, FormField, FormSection } from "@/types";
import ApplicationPdfViewer from "@/components/applications/ApplicationPdfViewer";
import { ApplicationStatusAlert } from "@/components/application/ApplicationStatusAlert";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  const { user } = useSession();
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [allFormFields, setAllFormFields] = useState<FormField[]>([]);
  const [allFormSections, setAllFormSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          submitted_date,
          program_id,
          user_id,
          stage_id,
          programs ( title, form_id, allow_pdf_download ),
          program_stages ( name, description, step_type )
        `)
        .eq('user_id', user.id)
        .order('submitted_date', { ascending: false });

      if (error) {
        setError(error.message);
        console.error("Error fetching applications:", error);
      } else if (data) {
        const formattedData = data.map(app => ({
          ...app,
          programs: Array.isArray(app.programs) ? app.programs[0] : app.programs,
          program_stages: Array.isArray(app.program_stages) ? app.program_stages[0] : app.program_stages,
        }));
        setApplications(formattedData as UserApplication[]);

        const uniqueFormIds = [...new Set(formattedData.map(app => app.programs?.form_id).filter(Boolean))];

        if (uniqueFormIds.length > 0) {
          const { data: fieldsData, error: fieldsError } = await supabase
            .from('form_fields')
            .select('*')
            .in('form_id', uniqueFormIds)
            .order('order', { ascending: true });

          if (fieldsError) {
            console.error("Error fetching all form fields for PDF:", fieldsError);
          } else {
            setAllFormFields(fieldsData as FormField[]);
          }

          const { data: sectionsData, error: sectionsError } = await supabase
            .from('form_sections')
            .select('*')
            .in('form_id', uniqueFormIds)
            .order('order', { ascending: true });

          if (sectionsError) {
            console.error("Error fetching all form sections for PDF:", sectionsError);
          } else {
            setAllFormSections(sectionsData as FormSection[]);
          }
        }
      }
      setLoading(false);
    };

    fetchApplications();
  }, [user]);

  const fetchApplicationResponses = async (applicationId: string) => {
    const { data, error } = await supabase
      .from('application_responses')
      .select(`value, form_fields ( id, label, field_type, options, is_required, order, display_rules, help_text, description, tooltip )`)
      .eq('application_id', applicationId);

    if (error) {
      console.error("Error fetching application responses for PDF:", error);
      return [];
    }
    return data.map(res => ({
      ...res,
      form_fields: Array.isArray(res.form_fields) ? res.form_fields[0] : res.form_fields
    }));
  };

  if (loading) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-6 w-28" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="container py-12 text-center text-destructive">Error: {error}</div>;
  }

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
          <CardDescription>
            Here is a list of all your submitted applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length > 0 ? applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Link to={`/programs/${app.program_id}`} className="font-medium hover:underline">
                      {app.programs?.title || 'Unknown Program'}
                    </Link>
                    {app.program_stages?.step_type === 'status' && app.program_stages.description && (
                      <ApplicationStatusAlert stage={app.program_stages} />
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(app.submitted_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{app.program_stages?.name || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {app.program_stages?.step_type === 'resubmission' ? (
                      <Button asChild>
                        <Link to={`/application/${app.id}/edit`}>Edit & Resubmit</Link>
                      </Button>
                    ) : app.programs?.allow_pdf_download ? (
                      <ApplicationPdfViewer
                        applicationId={app.id}
                        programTitle={app.programs?.title || 'Application'}
                        applicantFullName={user?.user_metadata?.full_name || user?.email || 'Applicant'}
                        applicantEmail={user?.email || 'N/A'}
                        submittedDate={app.submitted_date}
                        currentStageName={app.program_stages?.name || 'N/A'}
                        allResponses={[]}
                        allFormFields={allFormFields.filter(f => f.form_id === app.programs?.form_id)}
                        formSections={allFormSections.filter(s => s.form_id === app.programs?.form_id)}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    You haven't submitted any applications yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;