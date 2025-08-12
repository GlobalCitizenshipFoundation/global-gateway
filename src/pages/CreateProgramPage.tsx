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
import { useState } from "react";

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
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

const CreateProgramPage = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: ProgramFormValues) {
    if (!user) {
      showError("You must be logged in to create a program.");
      return;
    }
    setIsSubmitting(true);

    // 1. Create a new form first
    const { data: newFormData, error: formError } = await supabase.from("forms").insert({
      user_id: user.id,
      name: `${values.title} Application Form`, // Default name for the form
      is_template: false,
      status: 'draft',
    }).select('id').single();

    if (formError || !newFormData) {
      showError(`Failed to create application form: ${formError?.message}`);
      setIsSubmitting(false);
      return;
    }

    // 2. Then create the program, linking it to the new form
    const { data: programData, error: programError } = await supabase.from("programs").insert({
      user_id: user.id,
      title: values.title,
      description: values.description,
      deadline: values.deadline.toISOString(),
      status: 'draft',
      form_id: newFormData.id, // Link the new form
    }).select('id').single();

    if (programError || !programData) {
      showError(`Failed to create program: ${programError?.message}`);
      // Optionally, delete the created form if program creation fails
      await supabase.from('forms').delete().eq('id', newFormData.id);
      setIsSubmitting(false);
    } else {
      showSuccess("Program and its application form created successfully! Now, let's design your form.");
      navigate(`/creator/forms/${newFormData.id}/edit`); // Redirect to form builder
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