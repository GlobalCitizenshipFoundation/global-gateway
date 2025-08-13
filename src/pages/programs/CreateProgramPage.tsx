import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
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
import { useSession } from "@/contexts/auth/SessionContext";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "@/utils/toast";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form as FormType, WorkflowTemplate } from "@/types";
import { Label } from "@/components/ui/label";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

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
  formTemplateId: z.string().nullable().optional(),
  workflowTemplateId: z.string().nullable().optional(),
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

const CreateProgramPage = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTemplates, setFormTemplates] = useState<FormType[]>([]);
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      title: "",
      description: "",
      formTemplateId: null,
      workflowTemplateId: null,
    },
  });

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_template', true)
        .order('name', { ascending: true });

      if (error) {
        showError("Failed to load form templates: " + error.message);
      } else {
        setFormTemplates(data as FormType[]);
      }
    };
    fetchTemplates();
  }, [user]);

  useEffect(() => {
    const fetchWorkflowTemplates = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (error) {
        showError("Failed to load workflow templates: " + error.message);
      } else {
        setWorkflowTemplates(data as WorkflowTemplate[]);
      }
    };
    fetchWorkflowTemplates();
  }, [user]);

  async function onSubmit(values: ProgramFormValues) {
    if (!user) {
      showError("You must be logged in to create a program.");
      return;
    }
    setIsSubmitting(true);

    let newFormId: string;
    const now = new Date().toISOString();

    if (values.formTemplateId) {
      const template = formTemplates.find(t => t.id === values.formTemplateId);
      if (!template) {
        showError("Selected template not found.");
        setIsSubmitting(false);
        return;
      }

      const { data: newFormData, error: newFormError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: `${values.title} Application Form`,
        is_template: false,
        status: 'draft',
        description: template.description,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      }).select('id').single();

      if (newFormError || !newFormData) {
        showError(`Failed to create application form from template: ${newFormError?.message}`);
        setIsSubmitting(false);
        return;
      }
      newFormId = newFormData.id;

      const { data: templateSections, error: sectionsError } = await supabase
        .from('form_sections')
        .select('*')
        .eq('form_id', values.formTemplateId)
        .order('order', { ascending: true });

      const { data: templateFields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('id, form_id, section_id, label, field_type, options, is_required, order, display_rules, description, tooltip, placeholder, last_edited_by_user_id, last_edited_at')
        .eq('form_id', values.formTemplateId)
        .order('order', { ascending: true });

      if (sectionsError || fieldsError) {
        showError(`Failed to load template content: ${sectionsError?.message || fieldsError?.message}`);
        await supabase.from('forms').delete().eq('id', newFormId);
        setIsSubmitting(false);
        return;
      }

      const oldSectionIdMap = new Map<string, string>();
      const newSectionsToInsert = templateSections.map(section => {
        const newSectionId = crypto.randomUUID();
        oldSectionIdMap.set(section.id, newSectionId);
        return {
          id: newSectionId,
          form_id: newFormId,
          name: section.name,
          order: section.order,
          description: section.description,
          tooltip: section.tooltip,
          last_edited_by_user_id: user.id,
          last_edited_at: now,
        };
      });

      const newFieldsToInsert = templateFields.map(field => ({
        id: crypto.randomUUID(),
        form_id: newFormId,
        section_id: field.section_id ? oldSectionIdMap.get(field.section_id) : null,
        label: field.label,
        field_type: field.field_type,
        options: field.options,
        is_required: field.is_required,
        order: field.order,
        display_rules: field.display_rules,
        description: field.description,
        tooltip: field.tooltip,
        placeholder: field.placeholder,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      }));

      const { error: insertSectionsError } = await supabase.from('form_sections').insert(newSectionsToInsert);
      const { error: insertFieldsError } = await supabase.from('form_fields').insert(newFieldsToInsert);

      if (insertSectionsError || insertFieldsError) {
        showError(`Failed to copy template content: ${insertSectionsError?.message || insertFieldsError?.message}`);
        await supabase.from('forms').delete().eq('id', newFormId);
        setIsSubmitting(false);
        return;
      }

    } else {
      const { data: newFormData, error: formError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: `${values.title} Application Form`,
        is_template: false,
        status: 'draft',
        description: null,
        last_edited_by_user_id: user.id,
        last_edited_at: now,
      }).select('id').single();

      if (formError || !newFormData) {
        showError(`Failed to create blank application form: ${formError?.message}`);
        setIsSubmitting(false);
        return;
      }
      newFormId = newFormData.id;
    }

    const { data: programData, error: programError } = await supabase.from("programs").insert({
      user_id: user.id,
      title: values.title,
      description: values.description,
      deadline: values.deadline.toISOString(),
      status: 'draft',
      form_id: newFormId,
      workflow_template_id: values.workflowTemplateId || null,
    }).select('id').single();

    if (programError || !programData) {
      showError(`Failed to create program: ${programError?.message}`);
      await supabase.from('forms').delete().eq('id', newFormId);
      setIsSubmitting(false);
    } else {
      if (values.workflowTemplateId) {
        const { data: stepsToCopy, error: stepsError } = await supabase
          .from('workflow_steps')
          .select('name, order_index, step_type, description, form_id, email_template_id')
          .eq('workflow_template_id', values.workflowTemplateId)
          .order('order_index', { ascending: true });

        if (stepsError) {
          showError(`Program created, but failed to copy workflow steps: ${stepsError.message}`);
        } else if (stepsToCopy && stepsToCopy.length > 0) {
          const newStages = stepsToCopy.map(step => ({
            program_id: programData.id,
            name: step.name,
            order: step.order_index,
            step_type: step.step_type,
            description: step.description,
            form_id: step.form_id,
            email_template_id: step.email_template_id,
          }));

          const { error: insertStagesError } = await supabase
            .from('program_stages')
            .insert(newStages);

          if (insertStagesError) {
            showError(`Program created, but failed to insert workflow stages: ${insertStagesError.message}`);
          }
        }
      }
      showSuccess("Program created successfully!");
      navigate(`/creator/dashboard`);
    }
  }

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Create a New Program</CardTitle>
          <CardDescription>
            Fill out the details below to add a new opportunity. An application form will be automatically created for it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
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
              <FormField
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
              <FormField
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
              <FormField
                control={form.control}
                name="formTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start with Form Template (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template or start blank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Start from scratch (blank form)</SelectItem>
                        {formTemplates.length > 0 && <DropdownMenuSeparator />}
                        {formTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose an existing form template to pre-populate your new program's application form.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workflowTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workflow Template (Optional)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a workflow" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">No workflow attached</SelectItem>
                        {workflowTemplates.length > 0 && <DropdownMenuSeparator />}
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating Program..." : "Create Program"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProgramPage;