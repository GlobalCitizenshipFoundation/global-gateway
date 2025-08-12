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
import { Program, FormField, FormSection } from "@/types";
import { useEffect, useState, useMemo, useCallback } from "react";
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
import RichTextEditor from "@/components/RichTextEditor";
import { shouldFieldBeDisplayed } from "@/utils/formFieldUtils";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const ApplyPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useSession();
  const navigate = useNavigate();

  const [program, setProgram] = useState<Program | null>(null);
  const [formSections, setFormSections] = useState<FormSection[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');

  // Dynamic Zod schema based on formFields
  const dynamicFormSchema = useMemo(() => {
    const schemaFields: { [key: string]: z.ZodTypeAny } = {};
    formFields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.field_type) {
        case 'email':
          fieldSchema = z.string().email("Invalid email address.");
          break;
        case 'number':
          // For number, allow empty string for optional, then transform to number or undefined
          fieldSchema = z.string().regex(/^\d*$/, "Must be a valid number (or empty).")
            .transform(s => s === '' ? undefined : Number(s));
          break;
        case 'date':
          fieldSchema = z.string().datetime({ message: "Invalid date format." });
          break;
        case 'checkbox':
          fieldSchema = z.array(z.string());
          break;
        default: // text, textarea, select, radio, phone, richtext
          fieldSchema = z.string();
      }

      if (field.is_required) {
        if (field.field_type === 'checkbox') {
          fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(1, { message: "At least one option must be selected." });
        } else if (field.field_type === 'number') {
          // For required numbers, ensure it's not undefined after transform
          fieldSchema = (fieldSchema as z.ZodEffects<z.ZodString, number | undefined, string>).refine(val => val !== undefined, { message: "This field is required." });
        } else {
          fieldSchema = (fieldSchema as z.ZodString).min(1, { message: "This field is required." });
        }
      } else {
        // For optional fields, make them optional in Zod
        if (field.field_type === 'number') {
          // Already handled by transform to undefined for empty string
        } else if (field.field_type === 'checkbox') {
          fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).optional();
        } else {
          fieldSchema = (fieldSchema as z.ZodString).optional();
        }
      }
      schemaFields[field.id] = fieldSchema;
    });
    return z.object(schemaFields);
  }, [formFields]);

  type DynamicFormValues = z.infer<typeof dynamicFormSchema>;

  const form = useForm<DynamicFormValues>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: useMemo(() => {
      const defaults: { [key: string]: any } = {};
      formFields.forEach(field => {
        if (field.field_type === 'checkbox') {
          defaults[field.id] = [];
        } else if (field.field_type === 'number') {
          defaults[field.id] = undefined; // Default to undefined for numbers
        } else {
          defaults[field.id] = '';
        }
      });
      return defaults;
    }, [formFields]),
    mode: "onBlur", // Validate on blur for better UX
  });

  const { watch, setValue, trigger } = form;
  const currentResponses = watch(); // Watch all form values

  useEffect(() => {
    const fetchData = async () => {
      if (!programId || !user) return;
      setLoading(true);

      const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      setProfileFullName(profileData?.full_name || '');
      setProfileEmail(user.email || '');

      const { data: programData, error: programError } = await supabase.from('programs').select('id, title, description, deadline').eq('id', programId).single();
      if (programError) {
        showError("Error fetching program details.");
        setProgram(null);
      } else {
        setProgram({ ...programData, deadline: new Date(programData.deadline) } as Program);
      }

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('form_sections')
        .select('*')
        .eq('program_id', programId)
        .order('order', { ascending: true });

      if (sectionsError) {
        showError("Could not load form sections.");
      } else {
        setFormSections(sectionsData || []);
      }

      const { data: fieldsData, error: fieldsError } = await supabase.from('form_fields').select('*').eq('program_id', programId).order('order', { ascending: true });
      if (fieldsError) {
        showError("Could not load application form.");
      } else {
        setFormFields(fieldsData as FormField[]);
        // Set default values for react-hook-form after fields are loaded
        const initialFormValues: { [key: string]: any } = {};
        fieldsData.forEach(field => {
          if (field.field_type === 'checkbox') {
            initialFormValues[field.id] = [];
          } else if (field.field_type === 'number') {
            initialFormValues[field.id] = undefined; // Default to undefined for numbers
          } else {
            initialFormValues[field.id] = '';
          }
        });
        form.reset(initialFormValues);
      }

      setLoading(false);
    };

    fetchData();
  }, [programId, user, form]);

  const displayedFormFields = useMemo(() => {
    const allFormFields = formFields; // All fields are needed for conditional logic evaluation

    const filtered = formFields.filter(field => {
      const shouldDisplay = shouldFieldBeDisplayed(field, currentResponses as Record<string, string>, allFormFields);
      if (!shouldDisplay) {
        // Clear value if field is hidden
        const currentValue = currentResponses[field.id as keyof DynamicFormValues];
        let newValue: DynamicFormValues[typeof field.id]; // Declare with the exact target type

        if (field.field_type === 'checkbox') {
          newValue = [] as DynamicFormValues[typeof field.id];
        } else if (field.field_type === 'number') {
          // If a required number field is hidden, set it to 0 (a valid number)
          // If an optional number field is hidden, set it to undefined
          newValue = (field.is_required ? 0 : undefined) as DynamicFormValues[typeof field.id];
        } else {
          newValue = '' as DynamicFormValues[typeof field.id];
        }

        // Only update if the value is actually changing to avoid unnecessary re-renders/validations
        if (currentValue !== newValue) {
          setValue(field.id as keyof DynamicFormValues, newValue, { shouldValidate: false });
        }
      }
      return shouldDisplay;
    });

    return filtered;
  }, [currentResponses, formFields, setValue]);

  const getFieldsForSection = useCallback((sectionId: string | null) => {
    return displayedFormFields.filter(field => field.section_id === sectionId).sort((a, b) => a.order - b.order);
  }, [displayedFormFields]);

  const onSubmit = async (values: DynamicFormValues) => {
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

    const responseRecords: { application_id: string; field_id: string; value: string; }[] = [];

    // Only save responses for fields that were displayed and had a value
    for (const field of displayedFormFields) {
      const fieldValue = values[field.id as keyof DynamicFormValues];
      // Convert number (or undefined) back to string for storage if it's a number field
      const valueToStore = field.field_type === 'checkbox' ? JSON.stringify(fieldValue) :
                           (field.field_type === 'number' && fieldValue === undefined) ? '' : String(fieldValue);

      if (fieldValue !== undefined && fieldValue !== null && valueToStore !== '') {
        responseRecords.push({
          application_id: appData.id,
          field_id: field.id,
          value: valueToStore,
        });
      }
    }

    const { error: responsesError } = await supabase.from('application_responses').insert(responseRecords);
    if (responsesError) {
      showError(`Failed to save form responses: ${responsesError.message}`);
      await supabase.from('applications').delete().eq('id', appData.id); // Rollback application creation
    } else {
      showSuccess("Application submitted successfully!");
      navigate('/dashboard');
    }
    setSubmitting(false);
  };

  const renderFormField = (field: FormField) => (
    <FormFieldComponent
      key={field.id}
      control={form.control}
      name={field.id as keyof DynamicFormValues}
      render={({ field: formHookField }) => (
        <FormItem className="grid gap-2">
          <FormLabel htmlFor={field.id}>
            {field.label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          {field.help_text && <FormDescription>{field.help_text}</FormDescription>}
          <FormControl>
            {field.field_type === 'textarea' ? (
              <Textarea
                id={field.id}
                {...formHookField}
                value={formHookField.value || ''}
                required={field.is_required}
                disabled={submitting}
                className="min-h-[120px] resize-y"
              />
            ) : field.field_type === 'select' ? (
              <Select
                onValueChange={formHookField.onChange}
                value={formHookField.value || ''}
                required={field.is_required}
                disabled={submitting}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder={`Select an option`} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options as string[] || []).map((option, index) => (
                    <SelectItem key={index} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.field_type === 'radio' ? (
              <RadioGroup
                onValueChange={formHookField.onChange}
                value={formHookField.value || ''}
                required={field.is_required}
                disabled={submitting}
                className="space-y-2"
              >
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
                      checked={Array.isArray(formHookField.value) && formHookField.value.includes(option)}
                      onCheckedChange={(checked) => {
                        const currentValues = Array.isArray(formHookField.value) ? formHookField.value : [];
                        const newValues = checked
                          ? [...currentValues, option]
                          : currentValues.filter(v => v !== option);
                        formHookField.onChange(newValues);
                      }}
                      disabled={submitting}
                    />
                    <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                  </div>
                ))}
              </div>
            ) : field.field_type === 'email' ? (
              <Input
                id={field.id}
                type="email"
                {...formHookField}
                value={formHookField.value || ''}
                required={field.is_required}
                disabled={submitting}
              />
            ) : field.field_type === 'date' ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !formHookField.value && "text-muted-foreground"
                    )}
                    disabled={submitting}
                  >
                    {formHookField.value ? (
                      format(new Date(formHookField.value), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formHookField.value ? new Date(formHookField.value) : undefined}
                    onSelect={(date) => formHookField.onChange(date ? date.toISOString() : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : field.field_type === 'phone' ? (
              <Input
                id={field.id}
                type="tel"
                {...formHookField}
                value={formHookField.value || ''}
                required={field.is_required}
                disabled={submitting}
              />
            ) : field.field_type === 'number' ? (
              <Input
                id={field.id}
                type="number"
                {...formHookField}
                value={formHookField.value === undefined ? '' : formHookField.value} // Convert undefined to empty string for input display
                required={field.is_required}
                disabled={submitting}
              />
            ) : field.field_type === 'richtext' ? (
              <RichTextEditor
                value={formHookField.value || ''}
                onChange={formHookField.onChange}
                readOnly={submitting}
                className="min-h-[120px]"
              />
            ) : ( // Default to text input for any other type
              <Input
                id={field.id}
                {...formHookField}
                value={formHookField.value || ''}
                required={field.is_required}
                disabled={submitting}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

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

  const uncategorizedFields = getFieldsForSection(null);

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Apply for: {program.title}</CardTitle>
          <CardDescription>Your name and email are automatically included. Please fill out the custom fields below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
              {/* Display pre-filled user information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl">Your Information</CardTitle>
                  <CardDescription>This information is pre-filled from your account.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="applicant-full-name">Full Name</Label>
                    <Input id="applicant-full-name" value={profileFullName} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="applicant-email">Email</Label>
                    <Input id="applicant-email" type="email" value={profileEmail} disabled />
                  </div>
                </CardContent>
              </Card>

              {formSections.map(section => {
                const fieldsInSection = getFieldsForSection(section.id);
                if (fieldsInSection.length === 0) return null; // Don't render empty sections

                return (
                  <Card key={section.id} className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-xl">{section.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                      {fieldsInSection.map(renderFormField)}
                    </CardContent>
                  </Card>
                );
              })}

              {uncategorizedFields.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl">Additional Information</CardTitle>
                    <CardDescription>Fields not assigned to a specific section.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6">
                    {uncategorizedFields.map(renderFormField)}
                  </CardContent>
                </Card>
              )}

              <Button type="submit" className="w-full" disabled={submitting || formFields.length === 0}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
              {formFields.length === 0 && (<p className="text-sm text-center text-muted-foreground">This program does not have any application fields yet.</p>)}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyPage;