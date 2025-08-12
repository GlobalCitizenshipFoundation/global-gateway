import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, DisplayRule } from "@/types";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react"; // Import useEffect
import { Link, useParams } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client"; // Import supabase
import { showError, showSuccess } from "@/utils/toast"; // Import toasts

const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>(); // Changed from programId
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'published'>('draft');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
  } = useFormBuilderData(formId); // Pass formId

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
    handleUpdateFormStatus: performUpdateFormStatus, // New
  } = useFormBuilderActions({ formId, setSections, setFields, fetchData }); // Pass formId

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
              {/* Placeholder for Save as Template */}
              <Button variant="outline" disabled={true}>Save as Template</Button>
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
    </div>
  );
};

export default FormBuilderPage;