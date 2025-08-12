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
import { Program, FormField } from "@/types";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ApplyPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useSession();
  const navigate = useNavigate();

  const [program, setProgram] = useState<Program | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!programId || !user) return;
      setLoading(true);

      const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      setProfileFullName(profileData?.full_name || '');
      setProfileEmail(user.email || '');

      const { data: programData, error: programError } = await supabase.from('programs').select('*').eq('id', programId).single();
      if (programError) {
        showError("Error fetching program details.");
        setProgram(null);
      } else {
        setProgram({ ...programData, deadline: new Date(programData.deadline) } as Program);
      }

      const { data: fieldsData, error: fieldsError } = await supabase.from('form_fields').select('*').eq('program_id', programId).order('order', { ascending: true });
      if (fieldsError) {
        showError("Could not load application form.");
      } else {
        setFormFields(fieldsData as FormField[]);
        const initialResponses: Record<string, string> = {};
        fieldsData.forEach(field => {
          initialResponses[field.id] = field.field_type === 'checkbox' ? '[]' : '';
        });
        setResponses(initialResponses);
      }

      setLoading(false);
    };

    fetchData();
  }, [programId, user]);

  const handleResponseChange = (fieldId: string, value: string) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const currentValues = JSON.parse(responses[fieldId] || '[]') as string[];
    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter(v => v !== option);
    handleResponseChange(fieldId, JSON.stringify(newValues));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !program) return;
    setSubmitting(true);

    const { data: firstStage, error: stageError } = await supabase.from('program_stages').select('id').eq('program_id', program.id).order('order', { ascending: true }).limit(1).single();
    if (stageError || !firstStage) {
      showError(`Could not find starting stage for this program. ${stageError?.message || ''}`);
      setSubmitting(false);
      return;
    }

    const { data: appData, error: appError } = await supabase.from('applications').insert({
      program_id: program.id,
      user_id: user.id,
      full_name: profileFullName,
      email: profileEmail,
      stage_id: firstStage.id,
    }).select('id').single();

    if (appError || !appData) {
      showError(`Submission failed: ${appError.message}`);
      setSubmitting(false);
      return;
    }

    const responseRecords = Object.entries(responses).map(([field_id, value]) => ({
      application_id: appData.id,
      field_id,
      value,
    }));

    const { error: responsesError } = await supabase.from('application_responses').insert(responseRecords);
    if (responsesError) {
      showError(`Failed to save form responses: ${responsesError.message}`);
      await supabase.from('applications').delete().eq('id', appData.id);
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
          <CardHeader><Skeleton className="h-8 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="grid gap-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!program) {
    return <div className="container text-center py-12"><h1 className="text-2xl font-bold">Program not found</h1></div>;
  }

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Apply for: {program.title}</CardTitle>
          <CardDescription>Your name and email are automatically included. Please fill out the custom fields below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
            {formFields.map(field => (
              <div key={field.id} className="grid gap-2">
                <Label htmlFor={field.id}>{field.label}{field.is_required && <span className="text-destructive ml-1">*</span>}</Label>
                {field.field_type === 'textarea' ? (
                  <Textarea id={field.id} value={responses[field.id] || ''} onChange={e => handleResponseChange(field.id, e.target.value)} required={field.is_required} disabled={submitting} className="min-h-[120px] resize-y" />
                ) : field.field_type === 'select' ? (
                  <Select value={responses[field.id] || ''} onValueChange={value => handleResponseChange(field.id, value)} required={field.is_required} disabled={submitting}>
                    <SelectTrigger id={field.id}><SelectValue placeholder={`Select an option`} /></SelectTrigger>
                    <SelectContent>{(field.options as string[] || []).map((option, index) => (<SelectItem key={index} value={option}>{option}</SelectItem>))}</SelectContent>
                  </Select>
                ) : field.field_type === 'radio' ? (
                  <RadioGroup value={responses[field.id]} onValueChange={value => handleResponseChange(field.id, value)} required={field.is_required} disabled={submitting} className="space-y-2">
                    {(field.options as string[] || []).map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                        <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : field.field_type === 'checkbox' ? (
                  <div className="space-y-2">
                    {(field.options as string[] || []).map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${field.id}-${index}`}
                          checked={(JSON.parse(responses[field.id] || '[]')).includes(option)}
                          onCheckedChange={checked => handleCheckboxChange(field.id, option, !!checked)}
                          disabled={submitting}
                        />
                        <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </div>
                ) : field.field_type === 'email' ? (
                  <Input id={field.id} type="email" value={responses[field.id] || ''} onChange={e => handleResponseChange(field.id, e.target.value)} required={field.is_required} disabled={submitting} />
                ) : field.field_type === 'date' ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !responses[field.id] && "text-muted-foreground"
                        )}
                        disabled={submitting}
                      >
                        {responses[field.id] ? (
                          format(new Date(responses[field.id]), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={responses[field.id] ? new Date(responses[field.id]) : undefined}
                        onSelect={(date) => handleResponseChange(field.id, date ? date.toISOString() : '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input id={field.id} value={responses[field.id] || ''} onChange={e => handleResponseChange(field.id, e.target.value)} required={field.is_required} disabled={submitting} />
                )}
              </div>
            ))}
            <Button type="submit" className="w-full" disabled={submitting || formFields.length === 0}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
            {formFields.length === 0 && (<p className="text-sm text-center text-muted-foreground">This program does not have any application fields yet.</p>)}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyPage;