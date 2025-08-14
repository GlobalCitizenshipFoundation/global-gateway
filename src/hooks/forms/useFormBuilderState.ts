import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FormField, FormSection, Form as FormType, Tag as TagType } from '@/types';
import { useFormBuilderLoader } from './useFormBuilderLoader';
import { useFormDetailsState } from './useFormDetailsState';
import { useFormContentState } from './useFormContentState';
import { useFormBuilderUIState } from './useFormBuilderUIState';
import React from 'react'; // Explicit React import

export const useFormBuilderState = (initialFormId?: string) => {
  const { formId: paramFormId } = useParams<{ formId: string }>();
  const currentFormId = initialFormId || paramFormId;

  const {
    formDetails: initialFormDetails,
    sections: initialSections,
    fields: initialFields,
    loading,
    error,
    fetchData,
  } = useFormBuilderLoader(currentFormId);

  const formDetails = useFormDetailsState(initialFormDetails);
  const formContent = useFormContentState(initialSections, initialFields);
  const formUI = useFormBuilderUIState();

  useEffect(() => {
    if (!loading && initialFormDetails) {
      formDetails.setFormName(initialFormDetails.name);
      formDetails.setFormDescription(initialFormDetails.description || null);
      formDetails.setFormStatus(initialFormDetails.status);
      formDetails.setFormLastEditedAt(initialFormDetails.last_edited_at || null);
      formDetails.setFormLastEditedByUserId(initialFormDetails.last_edited_by_user_id || null);
      formDetails.setFormTags(initialFormDetails.tags || []);
      formDetails.setIsTemplate(initialFormDetails.is_template);

      formContent.setSections(initialSections);
      formContent.setFields(initialFields);

      formUI.setHasUnsavedChanges(false);
      formUI.setLastSavedTimestamp(initialFormDetails.last_edited_at ? new Date(initialFormDetails.last_edited_at) : null);
      formUI.setIsAutoSaving(false);
      formUI.setIsUpdatingStatus(false);
      formUI.setShowSavedConfirmation(false);
      formUI.setSelectedField(null);
      formUI.setSelectedSection(null);
      formUI.setIsSaveAsTemplateDialogOpen(false);
      formUI.setNewTemplateName('');
      formUI.setIsSavingTemplate(false);
      formUI.setIsFormPreviewOpen(false);
      formUI.setNewSectionName('');
      formUI.setNewSectionDescription('');
      formUI.setNewSectionTooltip('');
      formUI.setIsAddingSection(false);
      formUI.setNewFieldLabel('');
      formUI.setNewFieldType('text');
      formUI.setNewFieldOptions('');
      formUI.setNewFieldDescription('');
      formUI.setNewFieldTooltip('');
      formUI.setNewFieldPlaceholder('');
      formUI.setIsAddingField(false);
    }
  }, [loading, initialFormDetails, initialSections, initialFields, formDetails, formContent, formUI]);

  return {
    formId: currentFormId,
    loading,
    error,
    fetchData,

    formName: formDetails.formName,
    setFormName: formDetails.setFormName,
    formDescription: formDetails.formDescription,
    setFormDescription: formDetails.setFormDescription,
    formStatus: formDetails.formStatus,
    setFormStatus: formDetails.setFormStatus,
    formLastEditedAt: formDetails.formLastEditedAt,
    setFormLastEditedAt: formDetails.setFormLastEditedAt,
    formLastEditedByUserId: formDetails.formLastEditedByUserId,
    setFormLastEditedByUserId: formDetails.setFormLastEditedByUserId,
    lastEditedByUserName: formDetails.lastEditedByUserName,
    isTemplate: formDetails.isTemplate,
    formTags: formDetails.formTags,
    setFormTags: formDetails.setFormTags,

    sections: formContent.sections,
    setSections: formContent.setSections,
    fields: formContent.fields,
    setFields: formContent.setFields,
    newFieldSectionId: formContent.newFieldSectionId,
    setNewFieldSectionId: formContent.setNewFieldSectionId,
    getFieldsForSection: formContent.getFieldsForSection,

    isAutoSaving: formUI.isAutoSaving,
    setIsAutoSaving: formUI.setIsAutoSaving,
    lastSavedTimestamp: formUI.lastSavedTimestamp,
    setLastSavedTimestamp: formUI.setLastSavedTimestamp,
    hasUnsavedChanges: formUI.hasUnsavedChanges,
    setHasUnsavedChanges: formUI.setHasUnsavedChanges,
    isUpdatingStatus: formUI.isUpdatingStatus,
    setIsUpdatingStatus: formUI.setIsUpdatingStatus,
    showSavedConfirmation: formUI.showSavedConfirmation,
    setShowSavedConfirmation: formUI.setShowSavedConfirmation,
    selectedField: formUI.selectedField,
    setSelectedField: formUI.setSelectedField,
    selectedSection: formUI.selectedSection,
    setSelectedSection: formUI.setSelectedSection,
    isSaveAsTemplateDialogOpen: formUI.isSaveAsTemplateDialogOpen,
    setIsSaveAsTemplateDialogOpen: formUI.setIsSaveAsTemplateDialogOpen,
    newTemplateName: formUI.newTemplateName,
    setNewTemplateName: formUI.setNewTemplateName,
    isSavingTemplate: formUI.isSavingTemplate,
    setIsSavingTemplate: formUI.setIsSavingTemplate,
    isFormPreviewOpen: formUI.isFormPreviewOpen,
    setIsFormPreviewOpen: formUI.setIsFormPreviewOpen,
    newSectionName: formUI.newSectionName,
    setNewSectionName: formUI.setNewSectionName,
    newSectionDescription: formUI.newSectionDescription,
    setNewSectionDescription: formUI.setNewSectionDescription,
    newSectionTooltip: formUI.newSectionTooltip,
    setNewSectionTooltip: formUI.setNewSectionTooltip,
    isAddingSection: formUI.isAddingSection,
    setIsAddingSection: formUI.setIsAddingSection,
    newFieldLabel: formUI.newFieldLabel,
    setNewFieldLabel: formUI.setNewFieldLabel,
    newFieldType: formUI.newFieldType,
    setNewFieldType: formUI.setNewFieldType,
    newFieldOptions: formUI.newFieldOptions,
    setNewFieldOptions: formUI.setNewFieldOptions,
    newFieldDescription: formUI.newFieldDescription,
    setNewFieldDescription: formUI.setNewFieldDescription,
    newFieldTooltip: formUI.newFieldTooltip,
    setNewFieldTooltip: formUI.setNewFieldTooltip,
    newFieldPlaceholder: formUI.newFieldPlaceholder,
    setNewFieldPlaceholder: formUI.setNewFieldPlaceholder,
    isAddingField: formUI.isAddingField,
    setIsAddingField: formUI.setIsAddingField,
  };
};