import { useState, useEffect } from 'react';
import { Form as FormType } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface FormDetailsState {
  formName: string;
  setFormName: (name: string) => void;
  formDescription: string | null;
  setFormDescription: (description: string | null) => void;
  formStatus: 'draft' | 'published';
  setFormStatus: (status: 'draft' | 'published') => void;
  formLastEditedAt: string | null;
  setFormLastEditedAt: (timestamp: string | null) => void;
  formLastEditedByUserId: string | null;
  setFormLastEditedByUserId: (userId: string | null) => void;
  lastEditedByUserName: string | null;
  isTemplate: boolean;
  setIsTemplate: (isTemplate: boolean) => void; // Added setter
  formTags: FormType['tags'];
  setFormTags: (tags: FormType['tags']) => void;
}

export const useFormDetailsState = (initialFormDetails: FormType | null): FormDetailsState => {
  const [formName, setFormName] = useState(initialFormDetails?.name || '');
  const [formDescription, setFormDescription] = useState<string | null>(initialFormDetails?.description || null);
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>(initialFormDetails?.status || 'draft');
  const [formLastEditedAt, setFormLastEditedAt] = useState<string | null>(initialFormDetails?.last_edited_at || null);
  const [formLastEditedByUserId, setFormLastEditedByUserId] = useState<string | null>(initialFormDetails?.last_edited_by_user_id || null);
  const [lastEditedByUserName, setLastEditedByUserName] = useState<string | null>(null);
  const [isTemplate, setIsTemplate] = useState(initialFormDetails?.is_template || false);
  const [formTags, setFormTags] = useState<FormType['tags']>(initialFormDetails?.tags || []);

  // Sync initial data when it becomes available
  useEffect(() => {
    if (initialFormDetails) {
      setFormName(initialFormDetails.name);
      setFormDescription(initialFormDetails.description || null);
      setFormStatus(initialFormDetails.status);
      setFormLastEditedAt(initialFormDetails.last_edited_at || null);
      setFormLastEditedByUserId(initialFormDetails.last_edited_by_user_id || null);
      setIsTemplate(initialFormDetails.is_template);
      setFormTags(initialFormDetails.tags || []);
    }
  }, [initialFormDetails]);

  // Fetch last edited by user's full name
  useEffect(() => {
    const fetchUserName = async () => {
      if (formLastEditedByUserId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', formLastEditedByUserId)
          .single();
        if (error) {
          console.error("Error fetching last edited user name:", error);
          setLastEditedByUserName(null);
        } else if (data) {
          setLastEditedByUserName([data.first_name, data.last_name].filter(Boolean).join(' ').trim() || 'Unknown User');
        }
      } else {
        setLastEditedByUserName(null);
      }
    };
    fetchUserName();
  }, [formLastEditedByUserId]);

  return {
    formName, setFormName,
    formDescription, setFormDescription,
    formStatus, setFormStatus,
    formLastEditedAt, setFormLastEditedAt,
    formLastEditedByUserId, setFormLastEditedByUserId,
    lastEditedByUserName,
    isTemplate,
    setIsTemplate, // Expose setter
    formTags, setFormTags,
  };
};