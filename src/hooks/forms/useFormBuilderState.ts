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
  const [isTemplate, setIsTemplate] = useState(false);

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
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSection | null>(null);
  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false);

  // New section/field input states
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newSectionTooltip, setNewSectionTooltip] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
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
      .select('name, status, description, last_edited_at, last_edited_by_user_id, is_template')
      .eq('id', currentFormId)
      .single();
    
    if (formError) {
      showError("Could not fetch form details.");
      setFormName('');
      setFormDescription(null);
      setFormStatus('draft');
      setFormLastEditedAt(null);
      setFormLastEditedByUserId(null);
      setIsTemplate(false);
    } else {
      setFormName(formData.name);
      setFormDescription(formData.description);
      setFormStatus(formData.status);
      setFormLastEditedAt(formData.last_edited_at);
      setFormLastEditedByUserId(formData.last_edited_by_user_id);
      setIsTemplate(formData.is_template);
    }

    const { data: sectionsData, error: sectionsError } = await supabase
      .from('form_sections')
      .select('*, description, tooltip, display_rules, display_rules_logic_type')
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
    isTemplate, setIsTemplate,
    sections, setSections,
    fields, setFields,
    loading, setLoading,
    newFieldSectionId, setNewFieldSectionId,
    fetchData,
    getFieldsForSection,
    isAutoSaving, setIsAutoSaving,
    lastSavedTimestamp, setLastSavedTimestamp,
    hasUnsavedChanges, setHasUnsavedChanges,
    isUpdatingStatus, setIsUpdatingStatus,
    showSavedConfirmation, setShowSavedConfirmation,
    selectedField, setSelectedField,
    selectedSection, setSelectedSection,
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen,
    newTemplateName, setNewTemplateName,
    isSavingTemplate, setIsSavingTemplate,
    isFormPreviewOpen, setIsFormPreviewOpen,
    newSectionName, setNewSectionName,
    newSectionDescription, setNewSectionDescription,
    newSectionTooltip, setNewSectionTooltip,
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