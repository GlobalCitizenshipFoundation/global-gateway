import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, DisplayRule, FormSection } from "@/types";
import { ArrowLeft, CheckCircle2, FileText, Calendar, Mail, Phone, Hash, Type, List, Radio, CheckSquare, Text, Info } from "lucide-react"; // Import new icons
import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
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
import RichTextEditor from "@/components/RichTextEditor";

const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>();
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingFormDetails, setIsUpdatingFormDetails] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false); // New state for save feedback

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
    formName: fetchedFormName,
    formDescription: fetchedFormDescription,
    formStatus: fetchedFormStatus,
  } = useFormBuilderData(formId);

  // Sync local states with fetched data
  useEffect(() => {
    setFormName(fetchedFormName);
    setFormDescription(fetchedFormDescription || '');
    setFormStatus(fetchedFormStatus);
  }, [fetchedFormName, fetchedFormDescription, fetchedFormStatus]);

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
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 3000); // Hide after 3 seconds
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
      // Call the Edge Function to copy the current form as a template
      const { data, error: invokeError } = await supabase.functions.invoke('copy-form-template', {
        body: JSON.stringify({
          templateFormId: formId,
          newFormName: newTemplateName,
          newFormDescription: formDescription,
          userId: user.id,
          isTemplate: true, // This is a template
        }),
      });

      if (invokeError) {
        throw new Error(`Edge function error: ${invokeError.message}`);
      }
      if (data.error) {
        throw new Error(`Failed to save as template: ${data.error}`);
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

  // Map field types to Lucide icons
  const fieldTypeIcons: Record<FormField['field_type'], React.ElementType> = {
    text: Type,
    textarea: FileText,
    select: List,
    radio: Radio,
    checkbox: CheckSquare,
    email: Mail,
    date: Calendar,
    phone: Phone,
    number: Hash,
    richtext: Text,
  };

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
              <Button variant="outline" onClick={() => {
                setNewTemplateName(`${formName} Template`); // Pre-fill with current form name
                setIsSaveAsTemplateDialogOpen(true);
              }} disabled={isSavingTemplate}>
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
            <div className="flex justify-end items-center gap-2">
              {showSavedMessage && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Saved!
                </span>
              )}
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
              fieldTypeIcons={fieldTypeIcons} // Pass icons
            />

            <UncategorizedFieldsList
              uncategorizedFields={uncategorizedFields}
              handleDeleteField={handleDeleteField}
              handleToggleRequired={handleToggleRequired}
              onEditLogic={handleEditLogic}
              onEditField={handleEditField}
              fieldTypeIcons={fieldTypeIcons} // Pass icons
            />

            <DragOverlay>
              {activeFieldDragItem ? (
                <FormFieldItem
                  field={activeFieldDragItem}
                  onDelete={() => {}}
                  onToggleRequired={() => {}}
                  onEditLogic={() => {}}
                  onEdit={() => {}}
                  fieldTypeIcons={fieldTypeIcons} // Pass icons
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