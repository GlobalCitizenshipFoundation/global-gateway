import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Program, FormField, FormSection, Form as FormType } from "@/types";
import { showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shouldFieldBeDisplayed } from "@/utils/forms/formFieldUtils";

// Explicitly define the type for dynamic form values
export type DynamicFormValues = Record<string, string | string[] | number | undefined | null>;

interface UseFormLoaderProps {
  programId?: string;
  formId?: string; // Can be passed directly if programId is not available or form is standalone
  initialResponses?: DynamicFormValues; // For pre-filling form (e.g., editing existing application)
}

export const useFormLoader = ({ programId, formId: directFormId, initialResponses }: UseFormLoaderProps) => {
  const [program, setProgram] = useState<Program | null>(null);
  const [applicationForm, setApplicationForm] = useState<FormType | null>(null);
  const [formSections, setFormSections] = useState<FormSection[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine the actual formId to use
  const resolvedFormId = useMemo(() => {
    if (directFormId) return directFormId;
    if (program && program.form_id) return program.form_id;
    return null;
  }, [directFormId, program]);

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
          fieldSchema = z.string().regex(/^\d*$/, "Must be a valid number (or empty).")
            .transform(s => s === '' ? undefined : Number(s));
          break;
        case 'date':
          fieldSchema = z.string().datetime({ message: "Invalid date format." });
          break;
        case 'checkbox':
          fieldSchema = z.array(z.string());
          break;
        case 'rating':
          fieldSchema = z.preprocess(
            (val) => (val === '' ? undefined : Number(val)),
            z.number()
              .min(field.rating_min_value ?? 1, `Must be at least ${field.rating_min_value ?? 1}`)
              .max(field.rating_max_value ?? 5, `Must be at most ${field.rating_max_value ?? 5}`)
          );
          break;
        default: // text, textarea, select, radio, phone, richtext
          fieldSchema = z.string();
      }

      if (field.is_required) {
        if (field.field_type === 'checkbox') {
          fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(1, { message: "At least one option must be selected." });
        } else if (field.field_type === 'number' || field.field_type === 'rating') {
          fieldSchema = (fieldSchema as z.ZodEffects<any, number | undefined, any>).refine(val => val !== undefined, { message: "This field is required." });
        } else {
          fieldSchema = (fieldSchema as z.ZodString).min(1, { message: "This field is required." });
        }
      } else {
        if (field.field_type === 'checkbox') {
          fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).optional();
        } else if (field.field_type === 'number' || field.field_type === 'rating') {
          fieldSchema = (fieldSchema as z.ZodEffects<any, number | undefined, any>).optional();
        } else {
          fieldSchema = (fieldSchema as z.ZodString).optional();
        }
      }
      schemaFields[field.id] = fieldSchema;
    });
    return z.object(schemaFields);
  }, [formFields]);

  const form = useForm<DynamicFormValues>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: useMemo(() => {
      // Prioritize initialResponses if provided, otherwise generate defaults
      if (initialResponses) return initialResponses;

      const defaults: DynamicFormValues = {};
      formFields.forEach(field => {
        if (field.field_type === 'checkbox') {
          defaults[field.id] = [];
        } else if (field.field_type === 'number') {
          defaults[field.id] = undefined;
        } else if (field.field_type === 'rating') {
          defaults[field.id] = field.rating_min_value ?? 1;
        } else {
          defaults[field.id] = '';
        }
      });
      return defaults;
    }, [formFields, initialResponses]),
    mode: "onBlur",
  });

  const { watch, setValue } = form;
  const currentResponses = watch();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      let currentProgram: Program | null = null;
      let currentForm: FormType | null = null;
      let targetFormId: string | null = directFormId || null;

      if (programId) {
        const { data: programData, error: programError } = await supabase.from('programs').select('id, title, description, deadline, status, submission_button_text, allow_pdf_download, form_id').eq('id', programId).single();
        if (programError) {
          setError("Error fetching program details.");
          setProgram(null);
          setLoading(false);
          return;
        }
        currentProgram = { ...programData, deadline: new Date(programData.deadline) } as Program;
        setProgram(currentProgram);
        targetFormId = currentProgram.form_id;
      } else if (!directFormId) {
        setError("No program ID or form ID provided.");
        setLoading(false);
        return;
      }

      if (!targetFormId) {
        setError("No application form found for this program/context.");
        setLoading(false);
        return;
      }

      const { data: applicationFormData, error: applicationFormError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', targetFormId)
        .single();

      if (applicationFormError) {
        setError("Could not load application form details.");
        setApplicationForm(null);
        setLoading(false);
        return;
      }
      currentForm = applicationFormData as FormType;
      setApplicationForm(currentForm);

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('form_sections')
        .select('*, description, tooltip')
        .eq('form_id', currentForm.id)
        .order('order', { ascending: true });

      if (sectionsError) {
        setError("Could not load form sections.");
      } else {
        setFormSections(sectionsData || []);
      }

      const { data: fieldsData, error: fieldsError } = await supabase.from('form_fields').select('id, form_id, section_id, label, field_type, options, is_required, order, display_rules, description, tooltip, placeholder, last_edited_by_user_id, last_edited_at, date_min, date_max, date_allow_past, date_allow_future, rating_min_value, rating_max_value, rating_min_label, rating_max_label').eq('form_id', currentForm.id).order('order', { ascending: true });
      if (fieldsError) {
        setError("Could not load application form fields.");
      } else {
        setFormFields(fieldsData as FormField[]);
        // Reset form with initial responses or generated defaults
        const initialFormValues: DynamicFormValues = {};
        fieldsData.forEach(field => {
          if (initialResponses && initialResponses[field.id] !== undefined) {
            initialFormValues[field.id] = initialResponses[field.id];
          } else if (field.field_type === 'checkbox') {
            initialFormValues[field.id] = [];
          } else if (field.field_type === 'number') {
            initialFormValues[field.id] = undefined;
          } else if (field.field_type === 'rating') {
            initialFormValues[field.id] = field.rating_min_value ?? 1;
          } else {
            initialFormValues[field.id] = '';
          }
        });
        form.reset(initialFormValues);
      }

      setLoading(false);
    };

    fetchData();
  }, [programId, directFormId, form, initialResponses]);

  const displayedFormFields = useMemo(() => {
    const allFormFields = formFields;

    const filtered = formFields.filter(field => {
      const shouldDisplay = shouldFieldBeDisplayed(field, currentResponses, allFormFields);
      if (!shouldDisplay) {
        // Clear value if field is hidden by logic
        const currentValue = currentResponses[field.id];
        let newValue: DynamicFormValues[typeof field.id];

        if (field.field_type === 'checkbox') {
          newValue = [];
        } else if (field.is_required && (field.field_type === 'number' || field.field_type === 'rating')) {
          newValue = (field.field_type === 'rating' ? (field.rating_min_value ?? 1) : 0);
        } else {
          newValue = undefined; // Use undefined to clear optional fields
        }

        if (currentValue !== newValue) {
          setValue(field.id, newValue, { shouldValidate: false });
        }
      }
      return shouldDisplay;
    });

    return filtered;
  }, [currentResponses, formFields, setValue]);

  const getFieldsForSection = useCallback((sectionId: string | null) => {
    return displayedFormFields.filter(field => field.section_id === sectionId).sort((a, b) => a.order - b.order);
  }, [displayedFormFields]);

  return {
    program,
    applicationForm,
    formSections,
    formFields,
    loading,
    error,
    form,
    currentResponses,
    displayedFormFields,
    getFieldsForSection,
  };
};