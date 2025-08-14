import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { FormField, FormSection } from '@/types';
import React from 'react'; // Explicit React import

interface FormContentState {
  sections: FormSection[];
  setSections: Dispatch<SetStateAction<FormSection[]>>;
  fields: FormField[];
  setFields: Dispatch<SetStateAction<FormField[]>>;
  newFieldSectionId: string | null;
  setNewFieldSectionId: (sectionId: string | null) => void;
  getFieldsForSection: (sectionId: string | null) => FormField[];
}

export const useFormContentState = (initialSections: FormSection[], initialFields: FormField[]): FormContentState => {
  const [sections, setSections] = useState<FormSection[]>(initialSections);
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [newFieldSectionId, setNewFieldSectionId] = useState<string | null>(null);

  useEffect(() => {
    setSections(initialSections);
    setFields(initialFields);
  }, [initialSections, initialFields]);

  useEffect(() => {
    if (sections.length > 0 && newFieldSectionId === null) {
      setNewFieldSectionId(sections[0].id);
    }
  }, [sections, newFieldSectionId]);

  const getFieldsForSection = useCallback((sectionId: string | null): FormField[] => {
    return fields.filter((field: FormField) => field.section_id === sectionId).sort((a: FormField, b: FormField) => a.order - b.order);
  }, [fields]);

  return {
    sections, setSections,
    fields, setFields,
    newFieldSectionId, setNewFieldSectionId,
    getFieldsForSection,
  };
};