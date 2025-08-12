import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Program, FormField, FormSection } from "@/types";
import { useSession } from "@/contexts/SessionContext";
import { showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shouldFieldBeDisplayed } from "@/utils/formFieldUtils";

// Explicitly define the type for dynamic form values
type DynamicFormValues = Record<string, string | string[] | number | undefined | null>;

export const useApplicationForm = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useSession();

  const [program, setProgram] = useState<Program | null>(null);
  const [formSections, setFormSections] = useState<FormSection[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
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
          fieldSchema = (fieldSchema as z.ZodEffects<z.ZodString, number | undefined, string>).refine(val => val !== undefined, { message: "This field is required." });
        } else {
          fieldSchema = (fieldSchema as z.ZodString).min(1, { message: "This field is required." });
        }
      } else {
        if (field.field_type === 'checkbox') {
          fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).optional();
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
      const defaults: DynamicFormValues = {};
      formFields.forEach(field => {
        if (field.field_type === 'checkbox') {
          defaults[field.id] = [];
        } else if (field.field_type === 'number') {
          defaults[field.id] = undefined;
        } else {
          defaults[field.id] = '';
        }
      });
      return defaults;
    }, [formFields]),
    mode: "onBlur",
  });

  const { watch, setValue } = form;
  const currentResponses = watch();

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
        const initialFormValues: DynamicFormValues = {};
        fieldsData.forEach(field => {
          if (field.field_type === 'checkbox') {
            initialFormValues[field.id] = [];
          } else if (field.field_type === 'number') {
            initialFormValues[field.id] = undefined;
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
    const allFormFields = formFields;

    const filtered = formFields.filter(field => {
      const shouldDisplay = shouldFieldBeDisplayed(field, currentResponses, allFormFields);
      if (!shouldDisplay) {
        const currentValue = currentResponses[field.id];
        let newValue: DynamicFormValues[typeof field.id];

        if (field.field_type === 'checkbox') {
          newValue = [];
        } else if (field.field_type === 'number') {
          newValue = (field.is_required ? 0 : undefined);
        } else {
          newValue = '';
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
    formSections,
    formFields,
    loading,
    profileFullName,
    profileEmail,
    form,
    currentResponses,
    displayedFormFields,
    getFieldsForSection,
    user,
    programId,
  };
};