import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useParams, Link } from "react-router-dom";
import { showError, showSuccess } from "@/utils/toast";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkflowTemplate } from "@/types";
import { useSession } from "@/contexts/auth/SessionContext";
import { copyWorkflowStages } from "@/utils/programs/copyWorkflowStages"; // Import the utility

const programFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  deadline: z.date({
    required_error: "A deadline date is required.",
  }),
  submission_button_text: z.string().optional().nullable(),
  allow_pdf_download: z.boolean().optional(),
  workflow_template_id: z.string().nullable().optional(),
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

const EditProgramPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
  const [originalWorkflowTemplateId, setOriginalWorkflowTemplateId] = useState<string | null>(null); // To track changes

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
  });

  useEffect(() => {
    const fetchProgramAndWorkflows = async () => {
      if (!programId || !user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('programs')
        .select('title, description, deadline, submission_button_text, allow_pdf_download, form_id, workflow_template_id')
        .eq('id', programId)
        .single();

      if (error || !data) {
        showError("Failed to fetch program details.");
        navigate('/creator/dashboard');
      } else {
        form.reset({
          title: data.title,
          description: data.description || '',
          deadline: new Date(data.deadline),
          submission_button_text: data.submission_button_text || '',
          allow_pdf_download: data.allow_pdf_download || false,
          workflow_template_id: data.workflow_template_id || null,
        });
        setFormId(data.form_id);
        setOriginalWorkflowTemplateId(data.workflow_template_id || null); // Ensure it's string | null
      }

      const { data: wfData, error: wfError } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (wfError) {
        showError("Failed to load workflow templates: " + wfError.message);
      } else {
        setWorkflowTemplates(wfData as WorkflowTemplate[]);
      }

      setLoading(false);
    };
    fetchProgramAndWorkflows();
  }, [programId, navigate, form, user]);

  async function onSubmit(values: ProgramFormValues) {
    setIsSubmitting(true);
    const { error } = await supabase
      .from("programs")
      .update({
        title: values.title,
        description: values.description,
        deadline: values.deadline.toISOString(),
        submission_button_text: values.submission_button_text || null,
        allow_pdf_download: values.allow_pdf_download || false,
        workflow_template_id: values.workflow_template_id || null,
      })
      .eq('id', programId!);

    if (error) {
      showError(`Failed to update program: ${error.message}`);
    } else {
      // Handle workflow template change
      if (values.workflow_template_id !== originalWorkflowTemplateId) {
        // Delete existing program stages for this program
        const { error: deleteStagesError } = await supabase
          .from('program_stages')
          .delete()
          .eq('program_id', programId!);

        if (deleteStagesError) {
          showError(`Program updated, but failed to clear old workflow stages: ${deleteStagesError.message}`);
          setIsSubmitting(false);
          return;
        }

        // If a new template is selected, copy its stages
        if (values.workflow_template_id && user) {
          const workflowCopySuccess = await copyWorkflowStages(values.workflow_template_id, programId!, user.id);
          if (!workflowCopySuccess) {
            showError("Program updated, but failed to copy new workflow stages from template.");
            setIsSubmitting(false);
            return;
          }
        }
        setOriginalWorkflowTemplateId(values.workflow_template_id || null); // Update original ID
      }

      showSuccess("Program updated successfully!");
      navigate("/creator/dashboard");
    }
    setIsSubmitting(false);
  }

  if (loading) {
    return (
      <div className="container py-12">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent className="space-y-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-8">
              <Skeleton className="h-10 w-1/2" />
              <Skeleton className="h-10 w-1/2" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Edit Program</CardTitle>
          <CardDescription>
            Update the details for your program below. Workflow stages can be managed separately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormFieldComponent
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Innovators in Science Scholarship" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormFieldComponent
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a detailed description of the program..."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormFieldComponent
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Application Deadline</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormFieldComponent
                control={form.control}
                name="submission_button_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Button Text</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Submit My Application'" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>
                      Customize the text on the final submission button for this program.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormFieldComponent
                control={form.control}
                name="allow_pdf_download"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Allow PDF Download
                      </FormLabel>
                      <FormDescription>
                        If checked, applicants will have an option to download their submitted application as a PDF.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormFieldComponent
                control={form.control}
                name="workflow_template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow Template</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a workflow" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">No workflow attached</SelectItem>
                        {workflowTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose a pre-defined workflow to manage the application pipeline for this program.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-between items-center">
                {formId && (
                  <Button variant="outline" asChild>
                    <Link to={`/creator/forms/${formId}/edit`}>Manage Application Form</Link>
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProgramPage;