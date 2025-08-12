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
import { useSession } from "@/contexts/SessionContext";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "@/utils/toast";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form as FormType } from "@/types";
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
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

const CreateProgramPage = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<FormType[]>([]);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      title: "",
      description: "",
      formTemplateId: null,
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
        setTemplates(data as FormType[]);
      }
    };
    fetchTemplates();
  }, [user]);

  async function onSubmit(values: ProgramFormValues) {
    if (!user) {
      showError("You must be logged in to create a program.");
      return;
    }
    setIsSubmitting(true);

    let newFormId: string;
    let formDescriptionForProgram: string | null = null;

    try {
      if (values.formTemplateId) {
        const template = templates.find(t => t.id === values.formTemplateId);
        if (!template) {
          showError("Selected template not found.");
          setIsSubmitting(false);
          return;
        }
        formDescriptionForProgram = template.description;

        // Call the Edge Function to copy the template
        const { data, error: invokeError } = await supabase.functions.invoke('copy-form-template', {
          body: JSON.stringify({
            templateFormId: values.formTemplateId,
            newFormName: `${values.title} Application Form`,
            newFormDescription: template.description,
            userId: user.id,
            isTemplate: false,
          }),
        });

        if (invokeError) {
          throw new Error(`Edge function error: ${invokeError.message}`);
        }
        if (data.error) {
          throw new Error(`Failed to create form from template: ${data.error}`);
        }
        newFormId = data.newFormId;

      } else {
        // Create a new blank form directly via Supabase client
        const { data: newFormData, error: formError } = await supabase.from("forms").insert({
          user_id: user.id,
          name: `${values.title} Application Form`,
          is_template: false,
          status: 'draft',
          description: null, // Blank form has no description initially
        }).select('id').single();

        if (formError || !newFormData) {
          throw new Error(`Failed to create blank application form: ${formError?.message}`);
        }
        newFormId = newFormData.id;
      }

      // Then create the program, linking it to the new form
      const { data: programData, error: programError } = await supabase.from("programs").insert({
        user_id: user.id,
        title: values.title,
        description: values.description,
        deadline: values.deadline.toISOString(),
        status: 'draft',
        form_id: newFormId, // Link the new form
      }).select('id').single();

      if (programError || !programData) {
        // If program creation fails, attempt to delete the newly created form
        await supabase.from('forms').delete().eq('id', newFormId);
        throw new Error(`Failed to create program: ${programError?.message}`);
      } else {
        showSuccess("Program and its application form created successfully! Now, let's design your form.");
        navigate(`/creator/forms/${newFormId}/edit`); // Redirect to form builder
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSubmitting(false);
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
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template or start blank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Start from scratch (blank form)</SelectItem>
                        {templates.length > 0 && <DropdownMenuSeparator />}
                        {templates.map(template => (
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating Program..." : "Create and Design Form"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProgramPage;