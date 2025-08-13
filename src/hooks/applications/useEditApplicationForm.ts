import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Program, FormField, FormSection, Form as FormType, Application } from "@/types";
import { useSession } from "@/contexts/auth/SessionContext";
import { showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { shouldFieldBeDisplayed } from "@/utils/forms/formFieldUtils";

type DynamicFormValues = Record<string, string | string[] | number | undefined | null>;

export const useEditApplicationForm = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useSession();

  const [application, setApplication] = useState<Application | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [applicationForm, setApplicationForm] = useState<FormType | null>(null);
  const [formSections, setFormSections] = useState<FormSection[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);

  const dynamicFormSchema = useMemo(() => {
    const schemaFields: { [key: string]: z.ZodTypeAny } = {};
    formFields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      switch (field.field_type) {
        case 'email': fieldSchema = z.string().email("Invalid email address."); break;
        case 'number': fieldSchema = z.string().regex(/^\d*$/, "Must be a valid number.").transform(s => s === '' ? undefined : Number(s)); break;
        case 'date': fieldSchema = z.string().datetime({ message: "Invalid date format." }); break;
        case 'checkbox': fieldSchema = z.array(z.string()); break;
        default: fieldSchema = z.string();
      }
      if (field.is_required) {
        if (field.field_type === 'checkbox') fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(1, { message: "At least one option must be selected." });
        else if (field.field_type === 'number') fieldSchema = (fieldSchema as z.ZodEffects<any, number | undefined, any>).refine(val => val !== undefined, { message: "This field is required." });
        else fieldSchema = (fieldSchema as z.ZodString).min(1, { message: "This field is required." });
      } else {
        fieldSchema = fieldSchema.optional();
      }
      schemaFields[field.id] = fieldSchema;
    });
    return z.object(schemaFields);
  }, [formFields]);

  const form = useForm<DynamicFormValues>({
    resolver: zodResolver(dynamicFormSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!applicationId || !user) { setLoading(false); return; }
      setLoading(true);

      const { data: appData, error: appError } = await supabase.from('applications').select('id, program_id, stage_id').eq('id', applicationId).single();
      if (appError || !appData) { showError("Could not load application."); setLoading(false); return; }
      setApplication(appData as Application);

      const { data: programData, error: programError } = await supabase.from('programs').select('*').eq('id', appData.program_id).single();
      if (programError || !programData) { showError("Could not load program details."); setLoading(false); return; }
      setProgram({ ...programData, deadline: new Date(programData.deadline) } as Program);

      const { data: currentStageData, error: currentStageError } = await supabase.from('program_stages').select('step_type, description').eq('id', appData.stage_id).single();
      if (currentStageError || !currentStageData || currentStageData.step_type !== 'resubmission') {
        showError("This application is not in a valid resubmission stage.");
        setLoading(false);
        return;
      }

      let targetFormId: string | null = null;
      try {
        const config = JSON.parse(currentStageData.description || '{}');
        const targetOrder = config.resubmission_for_stage_order;
        if (typeof targetOrder !== 'number') throw new Error("Resubmission target order not found.");

        const { data: targetStageData, error: targetStageError } = await supabase.from('program_stages').select('form_id').eq('program_id', appData.program_id).eq('order', targetOrder).single();
        if (targetStageError || !targetStageData) throw new Error("Could not find the original form stage.");
        targetFormId = targetStageData.form_id;
      } catch (e: any) {
        showError(e.message || "Error processing resubmission stage config.");
        setLoading(false);
        return;
      }

      if (!targetFormId) {
        showError("The original form for resubmission could not be identified.");
        setLoading(false);
        return;
      }

      const formId = targetFormId;
      const { data: appFormData, error: appFormError } = await supabase.from('forms').select('*').eq('id', formId).single();
      if (appFormError) { showError("Could not load form details."); setLoading(false); return; }
      setApplicationForm(appFormData as FormType);

      const { data: sectionsData, error: sectionsError } = await supabase.from('form_sections').select('*').eq('form_id', formId).order('order', { ascending: true });
      if (sectionsError) showError("Could not load form sections."); else setFormSections(sectionsData || []);

      const { data: fieldsData, error: fieldsError } = await supabase.from('form_fields').select('*').eq('form_id', formId).order('order', { ascending: true });
      if (fieldsError) { showError("Could not load form fields."); setLoading(false); return; }
      setFormFields(fieldsData as FormField[]);

      const { data: responsesData, error: responsesError } = await supabase.from('application_responses').select('value, form_fields(id, field_type)').eq('application_id', applicationId);
      if (responsesError) { showError("Could not load your previous answers."); } 
      else if (responsesData) {
        const defaultValues: DynamicFormValues = {};
        responsesData.forEach(res => {
          const field = Array.isArray(res.form_fields) ? res.form_fields[0] : res.form_fields;
          if (field && res.value) {
            let parsedValue: any = res.value;
            if (field.field_type === 'checkbox') try { parsedValue = JSON.parse(res.value); } catch { parsedValue = []; }
            else if (field.field_type === 'number' || field.field_type === 'rating') { parsedValue = parseFloat(res.value); if (isNaN(parsedValue)) parsedValue = undefined; }
            defaultValues[field.id] = parsedValue;
          }
        });
        form.reset(defaultValues);
      }
      setLoading(false);
    };
    fetchData();
  }, [applicationId, user, form]);

  const { watch, setValue } = form;
  const currentResponses = watch();

  const displayedFormFields = useMemo(() => {
    return formFields.filter(field => shouldFieldBeDisplayed(field, currentResponses, formFields));
  }, [currentResponses, formFields]);

  return { application, program, applicationForm, formSections, formFields, loading, form, displayedFormFields };
};