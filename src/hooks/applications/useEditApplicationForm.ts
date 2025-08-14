import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Application } from "@/types";
import { useSession } from "@/contexts/auth/SessionContext";
import { showError } from "@/utils/toast";
import { useFormLoader, DynamicFormValues } from "@/hooks/forms/useFormLoader"; // Import new hook

export const useEditApplicationForm = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useSession();

  const [application, setApplication] = useState<Application | null>(null);
  const [loadingApplicationData, setLoadingApplicationData] = useState(true);
  const [applicationDataError, setApplicationDataError] = useState<string | null>(null);

  const [targetFormId, setTargetFormId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchApplicationAndResponses = async () => {
      if (!applicationId || !user) {
        setLoadingApplicationData(false);
        return;
      }
      setLoadingApplicationData(true);
      setApplicationDataError(null);

      const { data: appData, error: appError } = await supabase.from('applications').select('id, program_id, stage_id, full_name, email').eq('id', applicationId).single();
      if (appError || !appData) {
        setApplicationDataError("Could not load application.");
        setLoadingApplicationData(false);
        return;
      }
      setApplication(appData as Application);

      const { data: currentStageData, error: currentStageError } = await supabase.from('program_stages').select('step_type, description').eq('id', appData.stage_id).single();
      if (currentStageError || !currentStageData || currentStageData.step_type !== 'resubmission') {
        setApplicationDataError("This application is not in a valid resubmission stage.");
        setLoadingApplicationData(false);
        return;
      }

      let resolvedTargetFormId: string | null = null;
      try {
        const config = JSON.parse(currentStageData.description || '{}');
        const targetOrder = config.resubmission_for_stage_order;
        if (typeof targetOrder !== 'number') throw new Error("Resubmission target order not found.");

        const { data: targetStageData, error: targetStageError } = await supabase.from('program_stages').select('form_id').eq('program_id', appData.program_id).eq('order', targetOrder).single();
        if (targetStageError || !targetStageData) throw new Error("Could not find the original form stage.");
        resolvedTargetFormId = targetStageData.form_id;
      } catch (e: any) {
        setApplicationDataError(e.message || "Error processing resubmission stage config.");
        setLoadingApplicationData(false);
        return;
      }

      if (!resolvedTargetFormId) {
        setApplicationDataError("The original form for resubmission could not be identified.");
        setLoadingApplicationData(false);
        return;
      }
      setTargetFormId(resolvedTargetFormId);
      setLoadingApplicationData(false);
    };
    fetchApplicationAndResponses();
  }, [applicationId, user]);

  // Use the new form loader hook, passing the dynamically determined formId and application ID
  const {
    program: loadedProgram, // Renamed to avoid conflict with local 'program' state
    applicationForm,
    formSections,
    formFields,
    loading: formLoaderLoading,
    error: formLoaderError,
    form,
    currentResponses,
    displayedFormFields,
    getFieldsForSection,
  } = useFormLoader({ formId: targetFormId, applicationId }); // Pass applicationId here

  const loading = loadingApplicationData || formLoaderLoading;
  const error = applicationDataError || formLoaderError;

  return {
    application,
    program: loadedProgram,
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