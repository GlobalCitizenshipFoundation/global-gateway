import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FormField, FormSection, Form as FormType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export const useFormBuilderState = (initialFormId?: string) => {
  const { formId: paramFormId } = useParams<{ formId: string }>();
  const currentFormId = initialFormId || paramFormId;

  // Form details state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [formLastEditedAt, setFormLastEditedAt] = useState<string | null>(null);
  const [formLastEditedByUserId, setFormLastEditedByUserId] = useState<string | null>(null);
  const [lastEditedByUserName, setLastEditedByUserName] = useState<string | null>(null);

  // Form content state
  const [sections, setSections] = useState<FormSection[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [newFieldSectionId, setNewFieldSectionId] = useState<string | null>(null);

  // Loading and saving states
  const [loading, setLoading] = useState(true);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false); // New state for "Saved!" message

  // Dialog states
  const [isLogicBuilderOpen, setIsLogicBuilderOpen] = useState(false);
  const [fieldToEditLogic, setFieldToEditLogic] = useState<FormField | null>(null);
  const [isEditFieldDialogOpen, setIsEditFieldDialogOpen] = useState(false);
  const [fieldToEditDetails, setFieldToEditDetails] = useState<FormField | null>(null);
  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false);

  // New section/field input states
  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldHelpText, setNewFieldHelpText] = useState('');
  const [newFieldDescription, setNewFieldDescription] = useState('');
  const [newFieldTooltip, setNewFieldTooltip] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentFormId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: formData, error: formError } = await supabase
      .from('forms')
      .select('name, status, description, last_edited_at, last_edited_by_user_id')
      .eq('id', currentFormId)
      .single();
    
    if (formError) {
      showError("Could not fetch form details.");
      setFormName('');
      setFormDescription(null);
      setFormStatus('draft');
      setFormLastEditedAt(null);
      setFormLastEditedByUserId(null);
    } else {
      setFormName(formData.name);
      setFormDescription(formData.description);
      setFormStatus(formData.status);
      setFormLastEditedAt(formData.last_edited_at);
      setFormLastEditedByUserId(formData.last_edited_by_user_id);
    }

    const { data: sectionsData, error: sectionsError } = await supabase
      .from('form_sections')
      .select('*')
      .eq('form_id', currentFormId)
      .order('order', { ascending: true });
    
    if (sectionsError) {
      showError("Could not fetch form sections.");
    } else {
      setSections(sectionsData || []);
    }

    const { data: fieldsData, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', currentFormId)
      .order('order', { ascending: true });

    if (fieldsError) {
      showError("Could not fetch form fields.");
    } else {
      setFields(fieldsData as FormField[]);
    }
    setLoading(false);
  }, [currentFormId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (sections.length > 0 && newFieldSectionId === null) {
      setNewFieldSectionId(sections[0].id);
    }
  }, [sections, newFieldSectionId]);

  // Sync local states with fetched data
  useEffect(() => {
    if (!loading) {
      setHasUnsavedChanges(false);
      setLastSavedTimestamp(formLastEditedAt ? new Date(formLastEditedAt) : null);
    }
  }, [loading, formLastEditedAt]);

  // Fetch last edited by user's full name
  useEffect(() => {
    const fetchUserName = async () => {
      if (formLastEditedByUserId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', formLastEditedByUserId)
          .single();
        if (error) {
          console.error("Error fetching last edited user name:", error);
          setLastEditedByUserName(null);
        } else if (data) {
          setLastEditedByUserName(data.full_name || 'Unknown User');
        }
      } else {
        setLastEditedByUserName(null);
      }
    };
    fetchUserName();
  }, [formLastEditedByUserId]);

  const getFieldsForSection = useCallback((sectionId: string | null) => {
    return fields.filter(field => field.section_id === sectionId).sort((a, b) => a.order - b.order);
  }, [fields]);

  return {
    formId: currentFormId,
    formName, setFormName,
    formDescription, setFormDescription,
    formStatus, setFormStatus,
    formLastEditedAt, setFormLastEditedAt, // Expose setter for handlers
    formLastEditedByUserId, setFormLastEditedByUserId, // Expose setter for handlers
    lastEditedByUserName,
    sections, setSections,
    fields, setFields,
    loading, fetchData,
    newFieldSectionId, setNewFieldSectionId,
    getFieldsForSection,
    isAutoSaving, setIsAutoSaving,
    lastSavedTimestamp, setLastSavedTimestamp,
    hasUnsavedChanges, setHasUnsavedChanges,
    isUpdatingStatus, setIsUpdatingStatus,
    showSavedConfirmation, setShowSavedConfirmation, // New: Expose setter
    isLogicBuilderOpen, setIsLogicBuilderOpen,
    fieldToEditLogic, setFieldToEditLogic,
    isEditFieldDialogOpen, setIsEditFieldDialogOpen,
    fieldToEditDetails, setFieldToEditDetails,
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen,
    newTemplateName, setNewTemplateName,
    isSavingTemplate, setIsSavingTemplate,
    isFormPreviewOpen, setIsFormPreviewOpen,
    newSectionName, setNewSectionName,
    isAddingSection, setIsAddingSection,
    newFieldLabel, setNewFieldLabel,
    newFieldType, setNewFieldType,
    newFieldOptions, setNewFieldOptions,
    newFieldHelpText, setNewFieldHelpText,
    newFieldDescription, setNewFieldDescription,
    newFieldTooltip, setNewFieldTooltip,
    newFieldPlaceholder, setNewFieldPlaceholder,
    isAddingField, setIsAddingField,
  };
};