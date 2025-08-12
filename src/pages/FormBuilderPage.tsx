import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, DisplayRule, FormSection } from "@/types";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
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
import { useSession } from "@/contexts/SessionContext";
import { useFormSectionDragAndDrop } from "@/hooks/useFormSectionDragAndDrop";
import RichTextEditor from "@/components/RichTextEditor"; // Import RichTextEditor

const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState(''); // New state for form description
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingFormDetails, setIsUpdatingFormDetails] = useState(false); // New state for saving form details

  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const { user } = useSession();

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
    formName: fetchedFormName, // Get formName from hook
    formDescription: fetchedFormDescription, // Get formDescription from hook
    formStatus: fetchedFormStatus, // Get formStatus from hook
  } = useFormBuilderData(formId);

  // Sync local states with fetched data
  useEffect(() => {
    setFormName(fetchedFormName);
    setFormDescription(fetchedFormDescription || '');
    setFormStatus(fetchedFormStatus);
  }, [fetchedFormName, fetchedFormDescription, fetchedFormStatus]);

  useEffect(() => {
    if (searchParams.get('saveAsTemplate') === 'true' && formName) {
      setNewTemplateName(`${formName} Template`);
      setIsSaveAsTemplateDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, formName, setSearchParams]);

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
  };

  const {
    handleAddSection: performAddSection,
    handleDeleteSection: performDeleteSection,
    handleAddField: performAddField,
    handleDeleteField: performDeleteField,
    handleToggleRequired: performToggleRequired,
    handleSaveLogic: performSaveLogic,
    handleSaveEditedField: performSaveEditedField,
    handleUpdateFormStatus: performUpdateFormStatus,
    handleUpdateFormDetails: performUpdateFormDetails, // New: import form details update
  } = useFormBuilderActions({ formId, setSections, setFields, fetchData });

  const [newSectionName, setNewSectionName] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldHelpText, setNewFieldHelpText] = useState('');
  const [newFieldDescription, setNewFieldDescription] = useState('');
  const [newFieldTooltip, setNewFieldTooltip] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  const [isLogicBuilderOpen, setIsLogicBuilderOpen] = useState(false);
  const [fieldToEditLogic, setFieldToEditLogic] = useState<FormField | null>(null);

  const [isEditFieldDialogOpen, setIsEditFieldDialogOpen] = useState(false);
  const [fieldToEditDetails, setFieldToEditDetails] = useState<FormField | null>(null);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingSection(true);
    const newSection = await performAddSection(newSectionName);
    if (newSection) {
      setNewSectionName('');
      setNewFieldSectionId(newSection.id);
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

  const handleSaveFormDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId) return;
    setIsUpdatingFormDetails(true);
    const success = await performUpdateFormDetails(formId, formName, formDescription);
    if (success) {
      showSuccess("Form details updated successfully!");
    }
    setIsUpdatingFormDetails(false);
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
      const { data: newTemplateFormData, error: newTemplateFormError } = await supabase.from("forms").insert({
        user_id: user.id,
        name: newTemplateName,
        is_template: true,
        status: 'published',
        description: formDescription, // Copy description to template
      }).select('id').single();

      if (newTemplateFormError || !newTemplateFormData) {
        showError(`Failed to create template form: ${newTemplateFormError?.message}`);
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
          <form onSubmit={handleSaveFormDetails} className="space-y-4 mb-8 p-4 border rounded-md bg-muted/20">
            <h3 className="text-lg font-medium">Form Details</h3>
            <div className="grid gap-2">
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={isUpdatingFormDetails}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="form-description">Form Description (Optional)</Label>
              <RichTextEditor
                value={formDescription}
                onChange={setFormDescription}
                readOnly={isUpdatingFormDetails}
                className="min-h-[150px]"
              />
              <p className="text-sm text-muted-foreground">This description will appear at the top of the application form.</p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdatingFormDetails}>
                {isUpdatingFormDetails ? 'Saving...' : 'Save Details'}
              </Button>
            </div>
          </form>

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
            />

            <UncategorizedFieldsList
              uncategorizedFields={uncategorizedFields}
              handleDeleteField={handleDeleteField}
              handleToggleRequired={handleToggleRequired}
              onEditLogic={handleEditLogic}
              onEditField={handleEditField}
            />

            <DragOverlay>
              {activeFieldDragItem ? (
                <FormFieldItem
                  field={activeFieldDragItem}
                  onDelete={() => {}}
                  onToggleRequired={() => {}}
                  onEditLogic={() => {}}
                  onEdit={() => {}}
                />
              ) : activeSectionDragItem ? (
                <div className="p-4 bg-secondary rounded-md shadow-lg cursor-grabbing">
                  <span className="font-semibold">{activeSectionDragItem.name}</span>
                </div>
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