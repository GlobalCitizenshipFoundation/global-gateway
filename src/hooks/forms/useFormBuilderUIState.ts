import { useState } from 'react';
import { FormField, FormSection } from '@/types';

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
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false);

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSection | null>(null);

  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false);

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