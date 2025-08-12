import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, DisplayRule, FormSection } from "@/types";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigation } from "react-router-dom";
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { FormFieldItem } from "@/components/FormFieldItem";
import ConditionalLogicBuilder from "@/components/ConditionalLogicBuilder";
import EditFormFieldDialog from "@/components/EditFormFieldDialog";

// Import new modular components and hooks
import { useFormBuilderData } from "@/hooks/useFormBuilderData";
import { useFormFieldDragAndDrop } from "@/hooks/useFormFieldDragAndDrop";
import { useFormBuilderActions } from "@/hooks/useFormBuilderActions";
import { AddSectionForm } from "@/components/form-builder/AddSectionForm";
import { AddFieldForm } from "@/components/form-builder/AddFieldForm";
import { FormSectionsList } from "@/components/form-builder/FormSectionsList";
import { UncategorizedFieldsList } from "@/components/form-builder/UncategorizedFieldsList";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useSession } from "@/contexts/SessionContext"; // Corrected import statement
import { useFormSectionDragAndDrop } from "@/hooks/useFormSectionDragAndDrop";
import RichTextEditor from "@/components/RichTextEditor";
import { SaveAsTemplateDialog } from "@/components/forms/SaveAsTemplateDialog";
import FormPreviewDialog from "@/components/form-builder/FormPreviewDialog";

const AUTO_SAVE_DEBOUNCE_TIME = 2000; // 2 seconds

const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const { user } = useSession();
  const navigation = useNavigation();

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<Date | null>(null); // Changed to Date | null
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false); // New state for preview dialog

  const {
    sections,
    setSections,
    fields,
    setFields,
    loading,
    newFieldSectionId,
    setNewFieldSectionId,
    fetchData,
    getFieldsForSection,
    formName: fetchedFormName,
    formDescription: fetchedFormDescription,
    formStatus: fetchedFormStatus,
    formLastEditedAt,
    formLastEditedByUserId,
  } = useFormBuilderData(formId);

  // State for last edited user's full name
  const [lastEditedByUserName, setLastEditedByUserName] = useState<string | null>(null);

  // Sync local states with fetched data
  useEffect(() => {
    setFormName(fetchedFormName);
    setFormDescription(fetchedFormDescription || '');
    setFormStatus(fetchedFormStatus);
    if (!loading) {
      setHasUnsavedChanges(false); // Reset unsaved changes after initial load
      // Correctly set Date object or null
      setLastSavedTimestamp(formLastEditedAt ? new Date(formLastEditedAt) : null);
    }
  }, [fetchedFormName, fetchedFormDescription, fetchedFormStatus, loading, formLastEditedAt]);

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

  const {
    sensors: fieldSensors,
    onDragStart: onFieldDragStart,
    onDragEnd: onFieldDragEnd,
    activeDragItem: activeFieldDragItem,
  } = useFormFieldDragAndDrop({ fields, setFields, sections, fetchData });

  const {
    sensors: sectionSensors,
    onDragStart: onSectionDragStart,
    onDragEnd: onSectionDragEnd,
    activeDragItem: activeSectionDragItem,
  } = useFormSectionDragAndDrop({ sections, setSections, fetchData });

  const combinedSensors = [...fieldSensors, ...sectionSensors];

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "FormField") {
      onFieldDragStart(event);
    } else if (event.active.data.current?.type === "Section") {
      onSectionDragStart(event);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.active.data.current?.type === "FormField") {
      onFieldDragEnd(event);
    } else if (event.active.data.current?.type === "Section") {
      onSectionDragEnd(event);
    }
    setHasUnsavedChanges(true); // Mark as unsaved after drag/drop
  };

  const {
    handleAddSection: performAddSection,
    handleDeleteSection: performDeleteSection,
    handleAddField: performAddField,
    handleDeleteField: performDeleteField,
    handleToggleRequired: performToggleRequired,
    handleSaveLogic: performSaveLogic,
    handleSaveEditedField: performSaveEditedField,
    handleUpdateFieldLabel: performUpdateFieldLabel, // Destructure new function
    handleUpdateFormStatus: performUpdateFormStatus,
    handleUpdateFormDetails: performUpdateFormDetails,
  } = useFormBuilderActions({ formId, setSections, setFields, fetchData });

  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldHelpText, setNewFieldHelpText] = useState('');
  const [newFieldDescription, setNewFieldDescription] = useState('');
  const [newFieldTooltip, setNewFieldTooltip] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState(''); // New state for placeholder
  const [isAddingField, setIsAddingField] = useState(false);

  const [isLogicBuilderOpen, setIsLogicBuilderOpen] = useState(false);
  const [fieldToEditLogic, setFieldToEditLogic] = useState<FormField | null>(null);

  const [isEditFieldDialogOpen, setIsEditFieldDialogOpen] = useState(false);
  const [fieldToEditDetails, setFieldToEditDetails] = useState<FormField | null>(null);

  // Auto-save logic
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setHasUnsavedChanges(true); // Mark as unsaved immediately on change
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (!formId) return;
      setIsAutoSaving(true);
      const success = await performUpdateFormDetails(formId, formName, formDescription);
      if (success) {
        setLastSavedTimestamp(new Date()); // Store Date object
        setHasUnsavedChanges(false);
      } else {
        showError("Auto-save failed. Please check your connection.");
      }
      setIsAutoSaving(false);
    }, AUTO_SAVE_DEBOUNCE_TIME);
  }, [formId, formName, formDescription, performUpdateFormDetails]);

  // Effect to trigger auto-save on relevant state changes
  useEffect(() => {
    if (!loading) { // Only auto-save after initial load
      triggerAutoSave();
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formName, formDescription, sections, fields, loading, triggerAutoSave]); // Depend on sections and fields to trigger auto-save on their changes

  // Warning for unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingSection(true);
    const newSection = await performAddSection(newSectionName);
    if (newSection) {
      setNewSectionName('');
      setNewFieldSectionId(newSection.id);
      setHasUnsavedChanges(true); // Mark as unsaved
    }
    setIsAddingSection(false);
  };

  const handleDeleteSection = async (sectionId: string) => {
    await performDeleteSection(sectionId, sections, fields);
    setHasUnsavedChanges(true); // Mark as unsaved
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingField(true);
    const newField = await performAddField(newFieldLabel, newFieldType, newFieldOptions, newFieldSectionId, newFieldHelpText, newFieldDescription, newFieldTooltip, newFieldPlaceholder); // Pass newFieldPlaceholder
    if (newField) {
      setNewFieldLabel('');
      setNewFieldOptions('');
      setNewFieldType('text');
      setNewFieldHelpText('');
      setNewFieldDescription('');
      setNewFieldTooltip('');
      setNewFieldPlaceholder(''); // Reset placeholder
      setHasUnsavedChanges(true); // Mark as unsaved
    }
    setIsAddingField(false);
  };

  const handleDeleteField = async (fieldId: string) => {
    await performDeleteField(fieldId);
    setHasUnsavedChanges(true); // Mark as unsaved
  };

  const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
    await performToggleRequired(fieldId, isRequired);
    setHasUnsavedChanges(true); // Mark as unsaved
  };

  const handleEditLogic = (field: FormField) => {
    setFieldToEditLogic(field);
    setIsLogicBuilderOpen(true);
  };

  const handleSaveLogic = async (fieldId: string, rules: DisplayRule[]) => {
    await performSaveLogic(fieldId, rules);
    setHasUnsavedChanges(true); // Mark as unsaved
  };

  const handleEditField = (field: FormField) => {
    setFieldToEditDetails(field);
    setIsEditFieldDialogOpen(true);
  };

  const handleSaveEditedField = async (fieldId: string, values: { label: string; field_type: FormField['field_type']; options?: string; is_required: boolean; help_text?: string | null; description?: string | null; tooltip?: string | null; placeholder?: string | null; section_id?: string | null; }) => {
    await performSaveEditedField(fieldId, values);
    setIsEditFieldDialogOpen(false);
    setFieldToEditDetails(null);
    setHasUnsavedChanges(true); // Mark as unsaved
  };

  const handlePublishUnpublish = async (status: 'draft' | 'published') => {
    if (!formId) return;
    setIsUpdatingStatus(true);
    const success = await performUpdateFormStatus(formId, status);
    if (success) {
      setFormStatus(status);
      setHasUnsavedChanges(false); // Status change is a save
    }
    setIsUpdatingStatus(false);
  };

  const handleManualSaveDraft = async () => {
    if (!formId) return;
    setIsAutoSaving(true); // Use auto-saving state for manual save feedback
    const success = await performUpdateFormDetails(formId, formName, formDescription);
    if (success) {
      // Manually save all sections and fields by re-fetching and then updating their `updated_at`
      // This is a simplified approach; a more robust solution would track individual changes.
      // For now, we'll just ensure the form's main timestamp is updated.
      setLastSavedTimestamp(new Date()); // Store Date object
      setHasUnsavedChanges(false);
      showSuccess("Form draft saved successfully!");
    } else {
      showError("Failed to save draft. Please try again.");
    }
    setIsAutoSaving(false);
  };

  const handleSaveAsTemplate = async () => {
    if (!formId || !newTemplateName.trim()) {
      showError("Template name cannot be empty.");
      return;
    }
    if (!user) {
      showError("You must be logged in to save a template.");
      return;
    }

    setIsSavingTemplate(true);

    try {
      // Fetch current form details, sections, and fields
      const { data: currentFormData, error: fetchFormError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (fetchFormError || !currentFormData) {
        showError(`Failed to fetch current form details: ${fetchFormError?.message}`);
        return;
      }

      const { data: currentSections, error: sectionsError } = await supabase
        .from('form_sections')
        .select('*')
        .eq('form_id', formId)
        .order('order', { ascending: true });

      const { data: currentFields, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('order', { ascending: true });

      if (sectionsError || fieldsError) {
        showError(`Failed to load current form content: ${sectionsError?.message || fieldsError?.message}`);
        return;
      }

      // Create new template form entry
      const { data: newTemplateFormData, error: newTemplateFormError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: newTemplateName,
        is_template: true,
        status: 'published', // Templates are published by default
        description: currentFormData.description, // Copy description from current form
        last_edited_by_user_id: user.id, // Set editor
        last_edited_at: new Date().toISOString(), // Set timestamp
      }).select('id').single();

      if (newTemplateFormError || !newTemplateFormData) {
        showError(`Failed to create template form: ${newTemplateFormError?.message}`);
        return;
      }

      // Copy sections and fields to the new template form
      const oldSectionIdMap = new Map<string, string>();
      const newSectionsToInsert = currentSections.map(section => {
        const newSectionId = crypto.randomUUID();
        oldSectionIdMap.set(section.id, newSectionId);
        return {
          id: newSectionId,
          form_id: newTemplateFormData.id,
          name: section.name,
          order: section.order,
          last_edited_by_user_id: user.id, // Set editor
          last_edited_at: new Date().toISOString(), // Set timestamp
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
        placeholder: field.placeholder, // New: placeholder
        last_edited_by_user_id: user.id, // Set editor
        last_edited_at: new Date().toISOString(), // Set timestamp
      }));

      const { error: insertSectionsError } = await supabase.from('form_sections').insert(newSectionsToInsert);
      const { error: insertFieldsError } = await supabase.from('form_fields').insert(newFieldsToInsert);

      if (insertSectionsError || insertFieldsError) {
        showError(`Failed to copy form content to template: ${insertSectionsError?.message || insertFieldsError?.message}`);
        await supabase.from('forms').delete().eq('id', newTemplateFormData.id); // Rollback
        return;
      }

      showSuccess("Form saved as template successfully!");
      setIsSaveAsTemplateDialogOpen(false);
      setNewTemplateName('');
    } catch (err: any) {
      showError("An unexpected error occurred: " + err.message);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const uncategorizedFields = getFieldsForSection(null);

  return (
    <div className="container py-12">
      <Link to="/creator/forms" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Forms
      </Link>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Form Builder: {formName}</CardTitle>
              <CardDescription>
                Design your application form. Current Status: <Badge variant={formStatus === 'published' ? 'default' : 'secondary'}>{formStatus.charAt(0).toUpperCase() + formStatus.slice(1)}</Badge>
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              {isAutoSaving ? (
                <span className="text-blue-500">Saving...</span>
              ) : hasUnsavedChanges ? (
                <span className="text-orange-500">Unsaved changes</span>
              ) : (
                // Use toLocaleString directly on the Date object
                <span>Last saved: {lastSavedTimestamp ? lastSavedTimestamp.toLocaleString() : 'Never'}</span>
              )}
              {lastEditedByUserName && (
                <p className="text-xs">By: {lastEditedByUserName}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-8 p-4 border rounded-md bg-muted/20">
            <h3 className="text-lg font-medium">Form Details</h3>
            <div className="grid gap-2">
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="form-description">Form Description (Optional)</Label>
              <RichTextEditor
                value={formDescription}
                onChange={setFormDescription}
                className="min-h-[150px]"
              />
              <p className="text-sm text-muted-foreground">This description will appear at the top of the application form.</p>
            </div>
          </div>

          <DndContext sensors={combinedSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <FormSectionsList
              sections={sections}
              fields={fields}
              loading={loading}
              getFieldsForSection={getFieldsForSection}
              handleDeleteSection={handleDeleteSection}
              handleDeleteField={handleDeleteField}
              handleToggleRequired={handleToggleRequired}
              onEditLogic={handleEditLogic}
              onEditField={handleEditField}
              onUpdateLabel={performUpdateFieldLabel} // Pass the new function
            />

            <UncategorizedFieldsList
              uncategorizedFields={uncategorizedFields}
              handleDeleteField={handleDeleteField}
              handleToggleRequired={handleToggleRequired}
              onEditLogic={handleEditLogic}
              onEditField={handleEditField}
              onUpdateLabel={performUpdateFieldLabel} // Pass the new function
            />

            <DragOverlay>
              {activeFieldDragItem ? (
                <FormFieldItem
                  field={activeFieldDragItem}
                  onDelete={() => {}}
                  onToggleRequired={() => {}}
                  onEditLogic={() => {}}
                  onEdit={() => {}}
                  onUpdateLabel={() => {}} // Dummy for overlay
                />
              ) : activeSectionDragItem ? (
                <div className="p-4 bg-secondary rounded-md shadow-lg cursor-grabbing">
                  <span className="font-semibold">{activeSectionDragItem.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <Card className="mt-8 p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg">Add New Section</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AddSectionForm
                newSectionName={newSectionName}
                setNewSectionName={setNewSectionName}
                isSubmitting={isAddingSection}
                handleAddSection={handleAddSection}
              />
            </CardContent>
          </Card>

          <Card className="mt-8 p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg">Add New Field</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AddFieldForm
                newFieldLabel={newFieldLabel}
                setNewFieldLabel={setNewFieldLabel}
                newFieldType={newFieldType}
                setNewFieldType={setNewFieldType}
                newFieldOptions={newFieldOptions}
                setNewFieldOptions={setNewFieldOptions}
                newFieldSectionId={newFieldSectionId}
                setNewFieldSectionId={setNewFieldSectionId}
                newFieldHelpText={newFieldHelpText}
                setNewFieldHelpText={setNewFieldHelpText}
                newFieldDescription={newFieldDescription}
                setNewFieldDescription={setNewFieldDescription}
                newFieldTooltip={newFieldTooltip}
                setNewFieldTooltip={setNewFieldTooltip}
                newFieldPlaceholder={newFieldPlaceholder} // Pass newFieldPlaceholder
                setNewFieldPlaceholder={setNewFieldPlaceholder} // Pass setter
                isSubmitting={isAddingField}
                handleAddField={handleAddField}
                sections={sections}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mt-8 pt-4 border-t">
            <Button variant="outline" onClick={handleManualSaveDraft} disabled={isAutoSaving || !hasUnsavedChanges}>
              {isAutoSaving ? "Saving Draft..." : "Save Draft"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsFormPreviewOpen(true)}>
                Preview Form
              </Button>
              {formStatus === 'draft' ? (
                <Button onClick={() => handlePublishUnpublish('published')} disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? 'Publishing...' : 'Publish Form'}
                </Button>
              ) : (
                <Button variant="outline" onClick={() => handlePublishUnpublish('draft')} disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? 'Unpublishing...' : 'Unpublish Form'}
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsSaveAsTemplateDialogOpen(true)} disabled={isSavingTemplate}>
                Save as Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConditionalLogicBuilder
        isOpen={isLogicBuilderOpen}
        onClose={() => setIsLogicBuilderOpen(false)}
        fieldToEdit={fieldToEditLogic}
        allFields={fields}
        onSave={handleSaveLogic}
      />

      <EditFormFieldDialog
        isOpen={isEditFieldDialogOpen}
        onClose={() => setIsEditFieldDialogOpen(false)}
        fieldToEdit={fieldToEditDetails}
        onSave={handleSaveEditedField}
        sections={sections} // Pass sections to the dialog
      />

      <SaveAsTemplateDialog
        isOpen={isSaveAsTemplateDialogOpen}
        onClose={() => setIsSaveAsTemplateDialogOpen(false)}
        formToCopy={{
          id: formId || '',
          name: formName,
          description: formDescription,
          is_template: false,
          status: formStatus,
          user_id: user?.id || '',
          created_at: '', // Placeholder, will be overwritten by DB
          updated_at: '', // Placeholder, will be overwritten by DB
          last_edited_by_user_id: formLastEditedByUserId, // Include fetched value
          last_edited_at: formLastEditedAt, // Include fetched value
        }}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        isSaving={isSavingTemplate}
        onSave={handleSaveAsTemplate}
      />

      <FormPreviewDialog
        isOpen={isFormPreviewOpen}
        onClose={() => setIsFormPreviewOpen(false)}
        formName={formName}
        formDescription={formDescription}
        formSections={sections}
        formFields={fields}
      />
    </div>
  );
};

export default FormBuilderPage;