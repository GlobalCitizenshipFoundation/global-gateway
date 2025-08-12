import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, DisplayRule } from "@/types";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom"; // Import useSearchParams
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
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
import { useSession } from "@/contexts/SessionContext"; // Import useSession

const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const [searchParams, setSearchParams] = useSearchParams(); // For saveAsTemplate param
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const { user } = useSession(); // Get user from session

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
  } = useFormBuilderData(formId);

  useEffect(() => {
    const fetchFormDetails = async () => {
      if (!formId) return;
      const { data, error } = await supabase
        .from('forms')
        .select('name, status')
        .eq('id', formId)
        .single();

      if (error) {
        showError("Failed to load form details: " + error.message);
      } else if (data) {
        setFormName(data.name);
        setFormStatus(data.status);
      }
    };
    fetchFormDetails();
  }, [formId]);

  // Automatically open save as template dialog if param is present
  useEffect(() => {
    if (searchParams.get('saveAsTemplate') === 'true' && formName) {
      setNewTemplateName(`${formName} Template`);
      setIsSaveAsTemplateDialogOpen(true);
      setSearchParams({}, { replace: true }); // Clear the param
    }
  }, [searchParams, formName, setSearchParams]);

  const {
    sensors,
    onDragStart,
    onDragEnd,
    activeDragItem,
  } = useFormFieldDragAndDrop({ fields, setFields, sections, fetchData });

  const {
    handleAddSection: performAddSection,
    handleDeleteSection: performDeleteSection,
    handleAddField: performAddField,
    handleDeleteField: performDeleteField,
    handleToggleRequired: performToggleRequired,
    handleSaveLogic: performSaveLogic,
    handleSaveEditedField: performSaveEditedField,
    handleUpdateFormStatus: performUpdateFormStatus,
  } = useFormBuilderActions({ formId, setSections, setFields, fetchData });

  // States for Add Section Form
  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  // States for Add Field Form
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldHelpText, setNewFieldHelpText] = useState('');
  const [newFieldDescription, setNewFieldDescription] = useState('');
  const [newFieldTooltip, setNewFieldTooltip] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  // State for ConditionalLogicBuilder
  const [isLogicBuilderOpen, setIsLogicBuilderOpen] = useState(false);
  const [fieldToEditLogic, setFieldToEditLogic] = useState<FormField | null>(null);

  // State for EditFormFieldDialog
  const [isEditFieldDialogOpen, setIsEditFieldDialogOpen] = useState(false);
  const [fieldToEditDetails, setFieldToEditDetails] = useState<FormField | null>(null);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingSection(true);
    const newSection = await performAddSection(newSectionName);
    if (newSection) {
      setNewSectionName('');
      setNewFieldSectionId(newSection.id); // Automatically select the new section
    }
    setIsAddingSection(false);
  };

  const handleDeleteSection = async (sectionId: string) => {
    await performDeleteSection(sectionId, sections, fields);
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingField(true);
    const newField = await performAddField(newFieldLabel, newFieldType, newFieldOptions, newFieldSectionId, newFieldHelpText, newFieldDescription, newFieldTooltip);
    if (newField) {
      setNewFieldLabel('');
      setNewFieldOptions('');
      setNewFieldType('text');
      setNewFieldHelpText('');
      setNewFieldDescription('');
      setNewFieldTooltip('');
    }
    setIsAddingField(false);
  };

  const handleDeleteField = async (fieldId: string) => {
    await performDeleteField(fieldId);
  };

  const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
    await performToggleRequired(fieldId, isRequired);
  };

  const handleEditLogic = (field: FormField) => {
    setFieldToEditLogic(field);
    setIsLogicBuilderOpen(true);
  };

  const handleSaveLogic = async (fieldId: string, rules: DisplayRule[]) => {
    await performSaveLogic(fieldId, rules);
  };

  const handleEditField = (field: FormField) => {
    setFieldToEditDetails(field);
    setIsEditFieldDialogOpen(true);
  };

  const handleSaveEditedField = async (fieldId: string, values: { label: string; field_type: FormField['field_type']; options?: string; is_required: boolean; help_text?: string | null; description?: string | null; tooltip?: string | null; }) => {
    await performSaveEditedField(fieldId, values);
    setIsEditFieldDialogOpen(false);
    setFieldToEditDetails(null);
  };

  const handlePublishUnpublish = async (status: 'draft' | 'published') => {
    if (!formId) return;
    setIsUpdatingStatus(true);
    const success = await performUpdateFormStatus(formId, status);
    if (success) {
      setFormStatus(status);
    }
    setIsUpdatingStatus(false);
  };

  const handleSaveAsTemplate = async () => {
    if (!formId || !newTemplateName.trim()) {
      showError("Template name cannot be empty.");
      return;
    }
    if (!user) { // Use user from useSession
      showError("You must be logged in to save a template.");
      return;
    }

    setIsSavingTemplate(true);

    try {
      // 1. Create the new template form entry
      const { data: newTemplateFormData, error: newTemplateFormError } = await supabase.from("forms").insert({
        user_id: user.id, // Use user.id
        name: newTemplateName,
        is_template: true,
        status: 'published', // Templates are always published
      }).select('id').single();

      if (newTemplateFormError || !newTemplateFormData) {
        showError(`Failed to create template form: ${newTemplateFormError?.message}`);
        return;
      }

      // 2. Fetch sections and fields from the current form
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
        await supabase.from('forms').delete().eq('id', newTemplateFormData.id); // Rollback
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

      // 3. Insert new sections and fields
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
            <div className="flex gap-2">
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
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd} onDragStart={onDragStart}>
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
            />

            <UncategorizedFieldsList
              uncategorizedFields={uncategorizedFields}
              handleDeleteField={handleDeleteField}
              handleToggleRequired={handleToggleRequired}
              onEditLogic={handleEditLogic}
              onEditField={handleEditField}
            />

            <DragOverlay>
              {activeDragItem ? (
                <FormFieldItem
                  field={activeDragItem}
                  onDelete={() => {}}
                  onToggleRequired={() => {}}
                  onEditLogic={() => {}}
                  onEdit={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>

          <AddSectionForm
            newSectionName={newSectionName}
            setNewSectionName={setNewSectionName}
            isSubmitting={isAddingSection}
            handleAddSection={handleAddSection}
          />

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
            isSubmitting={isAddingField}
            handleAddField={handleAddField}
            sections={sections}
          />
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
      />

      {/* Save as Template Dialog */}
      <Dialog open={isSaveAsTemplateDialogOpen} onOpenChange={setIsSaveAsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Form as Template</DialogTitle>
            <DialogDescription>
              Give your new template a name. All sections and fields from this form will be copied.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Standard Application Template"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveAsTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAsTemplate} disabled={!newTemplateName.trim() || isSavingTemplate}>
              {isSavingTemplate ? 'Saving...' : 'Save as Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilderPage;