import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/auth/SessionContext";
import { showError } from "@/utils/toast";
import { useFormLoader, DynamicFormValues } from "@/hooks/forms/useFormLoader";
import React from "react"; // Explicit React import

export const useApplicationForm = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useSession();

  const [profileFullName, setProfileFullName] = useState<string>('');
  const [profileEmail, setProfileEmail] = useState<string>('');

  // Use the new form loader hook
  const {
    program,
    applicationForm,
    formSections,
    formFields,
    loading: formLoaderLoading,
    error: formLoaderError,
    form,
    currentResponses,
    displayedFormFields,
    getFieldsForSection,
  } = useFormLoader({ programId });

  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
      if (profileError && profileError.code !== 'PGRST116') {
        showError("Error fetching profile details.");
      } else if (profileData) {
        const fullName = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ').trim();
        setProfileFullName(fullName || '');
      }
      setProfileEmail(user.email || '');
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const loading = formLoaderLoading || loadingProfile;
  const error = formLoaderError;

  return {
    program,
    applicationForm,
    formSections,
    formFields,
    loading,
    error,
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