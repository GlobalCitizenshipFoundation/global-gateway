import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Form as FormType, FormField, FormSection } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

interface UseFormManagementActionsProps {
  setForms: React.Dispatch<React.SetStateAction<FormType[]>>;
  setTemplates: React.Dispatch<React.SetStateAction<FormType[]>>;
  templates: FormType[]; // Pass templates for create from template logic
}

export const useFormManagementActions = ({ setForms, setTemplates, templates }: UseFormManagementActionsProps) => {
  const { user } = useSession();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);

  const [isCreateFromTemplateDialogOpen, setIsCreateFromTemplateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newFormName, setNewFormName] = useState('');
  const [isCreatingForm, setIsCreatingForm] = useState(false);

  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false);
  const [templateFormToCopy, setTemplateFormToCopy] = useState<FormType | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const handleDeleteForm = async () => {
    if (!selectedForm) return;

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', selectedForm.id);

    if (error) {
      showError(`Failed to delete form: ${error.message}`);
    } else {
      showSuccess(`Form "${selectedForm.name}" deleted successfully.`);
      setForms(prev => prev.filter(f => f.id !== selectedForm.id));
      setTemplates(prev => prev.filter(t => t.id !== selectedForm.id));
    }
    setSelectedForm(null);
    setIsDeleteDialogOpen(false);
  };

  const handleUpdateFormStatus = async (formId: string, newStatus: 'draft' | 'published') => {
    const originalForms = [...templates, ...templates]; // Capture original state for rollback
    // Optimistic update
    setForms(prev => prev.map(f => f.id === formId ? { ...f, status: newStatus, updated_at: new Date().toISOString() } : f));
    setTemplates(prev => prev.map(f => f.id === formId ? { ...f, status: newStatus, updated_at: new Date().toISOString() } : f));


    const { error } = await supabase
      .from('forms')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', formId);

    if (error) {
      showError(`Failed to update form status: ${error.message}. Reverting.`);
      setForms(originalForms.filter(f => !f.is_template)); // Revert on error
      setTemplates(originalForms.filter(f => f.is_template)); // Revert on error
    } else {
      showSuccess(`Form status updated to "${newStatus}".`);
    }
  };

  const handleCreateBlankForm = async () => {
    if (!user) {
      showError("You must be logged in to create a form.");
      return;
    }
    setIsCreatingForm(true);
    const { data: newFormData, error: formError } = await supabase.from("forms").insert({
      user_id: user.id,
      name: "New Blank Form",
      is_template: false,
      status: 'draft',
      description: null,
      last_edited_by_user_id: user.id, // Added
      last_edited_at: new Date().toISOString(), // Added
    }).select('id').single();

    if (formError || !newFormData) {
      showError(`Failed to create blank form: ${formError?.message}`);
    } else {
      showSuccess("Blank form created successfully! Redirecting to form builder.");
      setForms(prev => [...prev, { ...newFormData, user_id: user.id, name: "New Blank Form", is_template: false, status: 'draft', description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_edited_by_user_id: user.id, last_edited_at: new Date().toISOString() }]);
      window.location.href = `/creator/forms/${newFormData.id}/edit`;
    }
    setIsCreatingForm(false);
  };

  const handleCreateFormFromTemplate = async () => {
    if (!user || !selectedTemplateId || !newFormName.trim()) {
      showError("Please select a template and provide a name for the new form.");
      return;
    }
    setIsCreatingForm(true);

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) {
      showError("Selected template not found.");
      setIsCreatingForm(false);
      return;
    }

    const { data: newFormData, error: newFormError } = await supabase.from("forms").insert({
      user_id: user.id,
      name: newFormName,
      is_template: false,
      status: 'draft',
      description: template.description,
      last_edited_by_user_id: user.id, // Added
      last_edited_at: new Date().toISOString(), // Added
    }).select('id').single();

    if (newFormError || !newFormData) {
      showError(`Failed to create new form: ${newFormError?.message}`);
      setIsCreatingForm(false);
      return;
    }

    const { data: templateSections, error: sectionsError } = await supabase
      .from('form_sections')
      .select('*')
      .eq('form_id', selectedTemplateId)
      .order('order', { ascending: true });

    const { data: templateFields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', selectedTemplateId)
      .order('order', { ascending: true });

    if (sectionsError || fieldsError) {
      showError(`Failed to load template content: ${sectionsError?.message || fieldsError?.message}`);
      await supabase.from('forms').delete().eq('id', newFormData.id);
      setIsCreatingForm(false);
      return;
    }

    const oldSectionIdMap = new Map<string, string>();
    const newSectionsToInsert = templateSections.map(section => {
      const newSectionId = crypto.randomUUID();
      oldSectionIdMap.set(section.id, newSectionId);
      return {
        id: newSectionId,
        form_id: newFormData.id,
        name: section.name,
        order: section.order,
      };
    });

    const newFieldsToInsert = templateFields.map(field => ({
      id: crypto.randomUUID(),
      form_id: newFormData.id,
      section_id: field.section_id ? oldSectionIdMap.get(field.section_id) : null,
      label: field.label,
      field_type: field.field_type,
      options: field.options,
      is_required: field.is_required,
      order: field.order,
      display_rules: field.display_rules,
      help_text: field.help_text,
      description: field.description,
      tooltip: field.tooltip,
    }));

    const { error: insertSectionsError } = await supabase.from('form_sections').insert(newSectionsToInsert);
    const { error: insertFieldsError } = await supabase.from('form_fields').insert(newFieldsToInsert);

    if (insertSectionsError || insertFieldsError) {
      showError(`Failed to copy template content: ${insertSectionsError?.message || insertFieldsError?.message}`);
      await supabase.from('forms').delete().eq('id', newFormData.id);
      setIsCreatingForm(false);
      return;
    }

    showSuccess("Form created from template successfully! Redirecting to form builder.");
    setForms(prev => [...prev, { ...newFormData, user_id: user!.id, name: newFormName, is_template: false, status: 'draft', description: template.description, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_edited_by_user_id: user!.id, last_edited_at: new Date().toISOString() }]);
    setIsCreateFromTemplateDialogOpen(false);
    window.location.href = `/creator/forms/${newFormData.id}/edit`;
    setIsCreatingForm(false);
  };

  const handleSaveAsTemplate = async () => {
    if (!templateFormToCopy || !newTemplateName.trim()) {
      showError("Template name cannot be empty.");
      return;
    }
    if (!user) {
      showError("You must be logged in to save a template.");
      return;
    }

    setIsSavingTemplate(true);

    try {
      const { data: newTemplateFormData, error: newTemplateFormError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: newTemplateName,
        is_template: true,
        status: 'published',
        description: templateFormToCopy.description,
        last_edited_by_user_id: user.id, // Added
        last_edited_at: new Date().toISOString(), // Added
      }).select('id').single();

      if (newTemplateFormError || !newTemplateFormData) {
        showError(`Failed to create template form: ${newTemplateFormError?.message}`);
        return;
      }

      const { data: currentSections, error: sectionsError } = await supabase
        .from('form_sections')
        .select('*')
        .eq('form_id', templateFormToCopy.id)
        .order('order', { ascending: true });

      const { data: currentFields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', templateFormToCopy.id)
        .order('order', { ascending: true });

      if (sectionsError || fieldsError) {
        showError(`Failed to load current form content: ${sectionsError?.message || fieldsError?.message}`);
        await supabase.from('forms').delete().eq('id', newTemplateFormData.id);
        return;
      }

      const oldSectionIdMap = new Map<string, string>();
      const newSectionsToInsert = currentSections.map(section => {
        const newSectionId = crypto.randomUUID();
        oldSectionIdMap.set(section.id, newSectionId);
        return {
          id: newSectionId,
          form_id: newTemplateFormData.id,
          name: section.name,
          order: section.order,
        };
      });

      const newFieldsToInsert = currentFields.map(field => ({
        id: crypto.randomUUID(),
        form_id: newTemplateFormData.id,
        section_id: field.section_id ? oldSectionIdMap.get(field.section_id) : null,
        label: field.label,
        field_type: field.field_type,
        options: field.options,
        is_required: field.is_required,
        order: field.order,
        display_rules: field.display_rules,
        help_text: field.help_text,
        description: field.description,
        tooltip: field.tooltip,
      }));

      const { error: insertSectionsError } = await supabase.from('form_sections').insert(newSectionsToInsert);
      const { error: insertFieldsError } = await supabase.from('form_fields').insert(newFieldsToInsert);

      if (insertSectionsError || insertFieldsError) {
        showError(`Failed to copy form content to template: ${insertSectionsError?.message || insertFieldsError?.message}`);
        await supabase.from('forms').delete().eq('id', newTemplateFormData.id);
        return;
      }

      showSuccess("Form saved as template successfully!");
      setForms(prev => [...prev, { ...newTemplateFormData, user_id: user!.id, name: newTemplateName, is_template: true, status: 'published', description: templateFormToCopy.description, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_edited_by_user_id: user!.id, last_edited_at: new Date().toISOString() }]);
      setTemplates(prev => [...prev, { ...newTemplateFormData, user_id: user!.id, name: newTemplateName, is_template: true, status: 'published', description: templateFormToCopy.description, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_edited_by_user_id: user!.id, last_edited_at: new Date().toISOString() }]);
      setIsSaveAsTemplateDialogOpen(false);
      setNewTemplateName('');
      setTemplateFormToCopy(null);
    } catch (err: any) {
      showError("An unexpected error occurred: " + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return {
    isDeleteDialogOpen, setIsDeleteDialogOpen, selectedForm, setSelectedForm, handleDeleteForm,
    isCreateFromTemplateDialogOpen, setIsCreateFromTemplateDialogOpen, selectedTemplateId, setSelectedTemplateId, newFormName, setNewFormName, isCreatingForm, handleCreateBlankForm, handleCreateFormFromTemplate,
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen, templateFormToCopy, setTemplateFormToCopy, newTemplateName, setNewTemplateName, isSavingTemplate, handleSaveAsTemplate,
    handleUpdateFormStatus,
  };
};