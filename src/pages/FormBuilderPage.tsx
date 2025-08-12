import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, DisplayRule } from "@/types";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { FormFieldItem } from "@/components/FormFieldItem";
import ConditionalLogicBuilder from "@/components/ConditionalLogicBuilder";
import EditFormFieldDialog from "@/components/EditFormFieldDialog";

// Import new modular components and hooks
import { useFormBuilderData } from "@/hooks/useFormBuilderData";
import { useFormFieldDragAndDrop } from "@/hooks/useFormFieldDragAndDrop";
import { useFormBuilderActions } from "@/hooks/useFormBuilderActions"; // New import
import { AddSectionForm } from "@/components/form-builder/AddSectionForm";
import { AddFieldForm } from "@/components/form-builder/AddFieldForm";
import { FormSectionsList } from "@/components/form-builder/FormSectionsList";
import { UncategorizedFieldsList } from "@/components/form-builder/UncategorizedFieldsList";

const FormBuilderPage = () => {
  const {
    programId,
    programTitle,
    sections,
    setSections,
    fields,
    setFields,
    loading,
    newFieldSectionId,
    setNewFieldSectionId,
    fetchData,
    getFieldsForSection,
  } = useFormBuilderData();

  const {
    sensors,
    onDragStart,
    onDragEnd,
    activeDragItem,
  } = useFormFieldDragAndDrop({ fields, setFields, sections, fetchData });

  const {
    handleAddSection: performAddSection, // Renamed to avoid conflict
    handleDeleteSection: performDeleteSection, // Renamed
    handleAddField: performAddField, // Renamed
    handleDeleteField: performDeleteField, // Renamed
    handleToggleRequired: performToggleRequired, // Renamed
    handleSaveLogic: performSaveLogic, // Renamed
    handleSaveEditedField: performSaveEditedField, // Renamed
  } = useFormBuilderActions({ programId, setSections, setFields, fetchData });

  const [newSectionName, setNewSectionName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldHelpText, setNewFieldHelpText] = useState(''); // New state for help text
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for ConditionalLogicBuilder
  const [isLogicBuilderOpen, setIsLogicBuilderOpen] = useState(false);
  const [fieldToEditLogic, setFieldToEditLogic] = useState<FormField | null>(null);

  // State for EditFormFieldDialog
  const [isEditFieldDialogOpen, setIsEditFieldDialogOpen] = useState(false);
  const [fieldToEditDetails, setFieldToEditDetails] = useState<FormField | null>(null);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newSection = await performAddSection(newSectionName, sections);
    if (newSection) {
      setNewSectionName('');
      setNewFieldSectionId(newSection.id); // Automatically select the new section
    }
    setIsSubmitting(false);
  };

  const handleDeleteSection = async (sectionId: string) => {
    await performDeleteSection(sectionId, sections, fields);
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newField = await performAddField(newFieldLabel, newFieldType, newFieldOptions, newFieldSectionId, newFieldHelpText, fields);
    if (newField) {
      setNewFieldLabel('');
      setNewFieldOptions('');
      setNewFieldType('text');
      setNewFieldHelpText(''); // Reset help text
    }
    setIsSubmitting(false);
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

  const handleSaveEditedField = async (fieldId: string, values: { label: string; field_type: FormField['field_type']; options?: string; is_required: boolean; help_text?: string | null; }) => {
    await performSaveEditedField(fieldId, values);
    setIsEditFieldDialogOpen(false);
    setFieldToEditDetails(null);
  };

  const uncategorizedFields = getFieldsForSection(null);

  return (
    <div className="container py-12">
      <Link to="/creator/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Programs
      </Link>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Form Builder</CardTitle>
          <CardDescription>
            Design the application form for your program: <span className="font-semibold">{programTitle}</span>
          </CardDescription>
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
            isSubmitting={isSubmitting}
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
            newFieldHelpText={newFieldHelpText} // New
            setNewFieldHelpText={setNewFieldHelpText} // New
            isSubmitting={isSubmitting}
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