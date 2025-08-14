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
  const [isTemplate, setIsTemplate] = useState(false); // New: is_template status

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
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);

  // UI interaction states
  const [selectedField, setSelectedField] = useState<FormField | null>(null); // New: for properties panel
  const [selectedSection, setSelectedSection] = useState<FormSection | null>(null); // New: for section properties panel
  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false);

  // New section/field input states
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState(''); // New: Section description
  const [newSectionTooltip, setNewSectionTooltip] = useState(''); // New: Section tooltip
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  // Removed newFieldHelpText
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
      .select('name, status, description, last_edited_at, last_edited_by_user_id, is_template') // Fetch is_template
      .eq('id', currentFormId)
      .single();
    
    if (formError) {
      showError("Could not fetch form details.");
      setFormName('');
      setFormDescription(null);
      setFormStatus('draft');
      setFormLastEditedAt(null);
      setFormLastEditedByUserId(null);
      setIsTemplate(false); // Reset is_template
    } else {
      setFormName(formData.name);
      setFormDescription(formData.description);
      setFormStatus(formData.status);
      setFormLastEditedAt(formData.last_edited_at);
      setFormLastEditedByUserId(formData.last_edited_by_user_id);
      setIsTemplate(formData.is_template); // Set is_template
    }

    const { data: sectionsData, error: sectionsError } = await supabase
      .from('form_sections')
      .select('*, description, tooltip') // Select new columns
      .eq('form_id', currentFormId)
      .order('order', { ascending: true });
    
    if (sectionsError) {
      showError("Could not fetch form sections.");
    } else {
      setSections(sectionsData || []);
    }

    const { data: fieldsData, error: fieldsError } = await supabase
      .from('form_fields')
      .select('id, form_id, section_id, label, field_type, options, is_required, order, display_rules, display_rules_logic_type, description, tooltip, placeholder, last_edited_by_user_id, last_edited_at, date_min, date_max, date_allow_past, date_allow_future, rating_min_value, rating_max_value, rating_min_label, rating_max_label, is_anonymized') // Explicitly select all columns including new ones
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
    formLastEditedAt, setFormLastEditedAt,
    formLastEditedByUserId, setFormLastEditedByUserId,
    lastEditedByUserName,
    isTemplate, // New: Expose isTemplate
    sections, setSections,
    fields, setFields,
    loading, fetchData,
    newFieldSectionId, setNewFieldSectionId,
    getFieldsForSection,
    isAutoSaving, setIsAutoSaving,
    lastSavedTimestamp, setLastSavedTimestamp,
    hasUnsavedChanges, setHasUnsavedChanges,
    isUpdatingStatus, setIsUpdatingStatus,
    showSavedConfirmation, setShowSavedConfirmation,
    selectedField, setSelectedField, // New: Expose selectedField
    selectedSection, setSelectedSection, // New: Expose selectedSection
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen,
    newTemplateName, setNewTemplateName,
    isSavingTemplate, setIsSavingTemplate,
    isFormPreviewOpen, setIsFormPreviewOpen,
    newSectionName, setNewSectionName,
    newSectionDescription, setNewSectionDescription, // New
    newSectionTooltip, setNewSectionTooltip, // New
    isAddingSection, setIsAddingSection,
    newFieldLabel, setNewFieldLabel,
    newFieldType, setNewFieldType,
    newFieldOptions, setNewFieldOptions,
    newFieldDescription, setNewFieldDescription,
    newFieldTooltip, setNewFieldTooltip,
    newFieldPlaceholder, setNewFieldPlaceholder,
    isAddingField, setIsAddingField,
  };
};