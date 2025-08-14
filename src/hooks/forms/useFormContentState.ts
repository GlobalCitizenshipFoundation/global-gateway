import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { FormField, FormSection } from '@/types';

interface FormContentState {
  sections: FormSection[];
  setSections: Dispatch<SetStateAction<FormSection[]>>; // Changed to Dispatch<SetStateAction<...>>
  fields: FormField[];
  setFields: Dispatch<SetStateAction<FormField[]>>; // Changed to Dispatch<SetStateAction<...>>
  newFieldSectionId: string | null;
  setNewFieldSectionId: (sectionId: string | null) => void;
  getFieldsForSection: (sectionId: string | null) => FormField[];
}

export const useFormContentState = (initialSections: FormSection[], initialFields: FormField[]): FormContentState => {
  const [sections, setSections] = useState<FormSection[]>(initialSections);
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [newFieldSectionId, setNewFieldSectionId] = useState<string | null>(null);

  // Sync initial data when it becomes available
  useEffect(() => {
    setSections(initialSections);
    setFields(initialFields);
  }, [initialSections, initialFields]);

  // Set default new field section to the first section if available
  useEffect(() => {
    if (sections.length > 0 && newFieldSectionId === null) {
      setNewFieldSectionId(sections[0].id);
    }
  }, [sections, newFieldSectionId]);

  const getFieldsForSection = useCallback((sectionId: string | null) => {
    return fields.filter(field => field.section_id === sectionId).sort((a, b) => a.order - b.order);
  }, [fields]);

  return {
    sections, setSections,
    fields, setFields,
    newFieldSectionId, setNewFieldSectionId,
    getFieldsForSection,
  };
};