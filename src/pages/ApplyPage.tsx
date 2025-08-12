import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Program } from "@/types";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";

const ApplyPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useSession();
  const navigate = useNavigate();

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [personalStatement, setPersonalStatement] = useState('');

  useEffect(() => {
    const fetchProgram = async () => {
      if (!programId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single();

      if (error) {
        console.error("Error fetching program:", error);
        setProgram(null);
      } else {
        setProgram({ ...data, deadline: new Date(data.deadline) } as Program);
      }
      setLoading(false);
    };

    const fetchUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setFullName(data.full_name || '');
        }
        setEmail(user.email || '');
      }
    };

    fetchProgram();
    fetchUserProfile();
  }, [programId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !program) return;

    setSubmitting(true);
    const { error } = await supabase.from('applications').insert({
      program_id: program.id,
      user_id: user.id,
      full_name: fullName,
      email: email,
      personal_statement: personalStatement,
      status: 'Submitted',
    });

    if (error) {
      showError(`Submission failed: ${error.message}`);
    } else {
      showSuccess("Application submitted successfully!");
      navigate('/dashboard');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="container py-12">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-36 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="container text-center py-12">
        <h1 className="text-2xl font-bold">Program not found</h1>
        <p className="text-muted-foreground">
          The program you are trying to apply for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Apply for: {program.title}</CardTitle>
          <CardDescription>
            Please fill out the form below to submit your application. Your name and email are pre-filled from your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required disabled={submitting} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled placeholder="m@example.com" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="statement">Personal Statement</Label>
                <Textarea
                  id="statement"
                  placeholder="Tell us about yourself and why you're a good fit for this opportunity..."
                  className="min-h-[150px]"
                  required
                  value={personalStatement}
                  onChange={e => setPersonalStatement(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting || program.status !== 'Open'}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
              {program.status !== 'Open' && <p className="text-center text-sm text-destructive">This program is not open for applications.</p>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyPage;