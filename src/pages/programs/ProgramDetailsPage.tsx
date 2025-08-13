import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Program } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";

const ProgramDetailsPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!programId) {
        setError("Program ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("programs")
        .select("id, title, description, deadline, status, created_at, updated_at, submission_button_text, allow_pdf_download")
        .eq("id", programId)
        .single();

      if (error) {
        setError(error.message);
        showError("Failed to load program details: " + error.message);
      } else if (data) {
        if (data.status !== 'published') {
          setError("This program is not published and cannot be viewed.");
          setProgram(null);
        } else {
          setProgram({ ...data, deadline: new Date(data.deadline) } as Program);
        }
      }
      setLoading(false);
    };

    fetchProgram();
  }, [programId]);

  if (loading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-6 w-48 mb-4" />
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full mt-4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="container text-center py-12">
        <h1 className="text-2xl font-bold">Program not found</h1>
        {error && <p className="text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to All Programs
      </Link>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl mb-2">{program.title}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {program.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Clock className="mr-2 h-4 w-4" />
            <span>Application Deadline: {program.deadline.toLocaleDateString()}</span>
          </div>
          <p className="text-base text-foreground">
            Ready to apply? Click the button below to start your application.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to={`/apply/${program.id}`}>Apply Now</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProgramDetailsPage;