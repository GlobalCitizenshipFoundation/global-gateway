import { useState } from 'react';
import { FormField, FormSection } from '@/types';
import React from 'react'; // Explicit React import

interface FormBuilderUIState {
  isAutoSaving: boolean;
  setIsAutoSaving: (isSaving: boolean) => void;
  lastSavedTimestamp: Date | null;
  setLastSavedTimestamp: (timestamp: Date | null) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  isUpdatingStatus: boolean;
  setIsUpdatingStatus: (isUpdating: boolean) => void;
  showSavedConfirmation: boolean;
  setShowSavedConfirmation: (show: boolean) => void;
  selectedField: FormField | null;
  setSelectedField: (field: FormField | null) => void;
  selectedSection: FormSection | null;
  setSelectedSection: (section: FormSection | null) => void;
  isSaveAsTemplateDialogOpen: boolean;
  setIsSaveAsTemplateDialogOpen: (isOpen: boolean) => void;
  newTemplateName: string;
  setNewTemplateName: (name: string) => void;
  isSavingTemplate: boolean;
  setIsSavingTemplate: (isSaving: boolean) => void;
  isFormPreviewOpen: boolean;
  setIsFormPreviewOpen: (isOpen: boolean) => void;
  newSectionName: string;
  setNewSectionName: (name: string) => void;
  newSectionDescription: string;
  setNewSectionDescription: (description: string) => void;
  newSectionTooltip: string;
  setNewSectionTooltip: (tooltip: string) => void;
  isAddingSection: boolean;
  setIsAddingSection: (isAdding: boolean) => void;
  newFieldLabel: string;
  setNewFieldLabel: (label: string) => void;
  newFieldType: FormField['field_type'];
  setNewFieldType: (type: FormField['field_type']) => void;
  newFieldOptions: string;
  setNewFieldOptions: (options: string) => void;
  newFieldDescription: string;
  setNewFieldDescription: (description: string) => void;
  newFieldTooltip: string;
  setNewFieldTooltip: (tooltip: string) => void;
  newFieldPlaceholder: string;
  setNewFieldPlaceholder: (placeholder: string) => void;
  isAddingField: boolean;
  setIsAddingField: (isAdding: boolean) => void;
}

export const useFormBuilderUIState = (): FormBuilderUIState => {
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState<boolean>(false);

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSection | null>(null);

  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [isSavingTemplate, setIsSavingTemplate] = useState<boolean>(false);
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState<boolean>(false);

  const [newSectionName, setNewSectionName] = useState<string>('');
  const [newSectionDescription, setNewSectionDescription] = useState<string>('');
  const [newSectionTooltip, setNewSectionTooltip] = useState<string>('');
  const [isAddingSection, setIsAddingSection] = useState<boolean>(false);

  const [newFieldLabel, setNewFieldLabel] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState<string>('');
  const [newFieldDescription, setNewFieldDescription] = useState<string>('');
  const [newFieldTooltip, setNewFieldTooltip] = useState<string>('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState<string>('');
  const [isAddingField, setIsAddingField] = useState<boolean>(false);

  return {
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