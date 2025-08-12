import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FormField, DisplayRule } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
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

  const [newSectionName, setNewSectionName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for ConditionalLogicBuilder
  const [isLogicBuilderOpen, setIsLogicBuilderOpen] = useState(false);
  const [fieldToEditLogic, setFieldToEditLogic] = useState<FormField | null>(null);

  // State for EditFormFieldDialog
  const [isEditFieldDialogOpen, setIsEditFieldDialogOpen] = useState(false);
  const [fieldToEditDetails, setFieldToEditDetails] = useState<FormField | null>(null);

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim() || !programId) return;

    setIsSubmitting(true);
    const nextOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('form_sections')
      .insert({
        program_id: programId,
        name: newSectionName,
        order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add section: ${error.message}`);
    } else if (data) {
      setSections([...sections, data]);
      setNewSectionName('');
      showSuccess("Section added successfully.");
      setNewFieldSectionId(data.id); // Automatically select the new section
    }
    setIsSubmitting(false);
  };

  const handleDeleteSection = async (sectionId: string) => {
    const { error } = await supabase.from('form_sections').delete().eq('id', sectionId);
    if (error) {
      showError(`Failed to delete section: ${error.message}`);
    } else {
      setSections(sections.filter(s => s.id !== sectionId));
      setFields(fields.filter(f => f.section_id !== sectionId)); // Also remove fields associated with this section
      showSuccess("Section deleted successfully.");
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !programId) return;

    setIsSubmitting(true);
    // Calculate order within the target section
    const targetSectionFields = fields.filter(f => f.section_id === newFieldSectionId);
    const nextOrder = targetSectionFields.length > 0 ? Math.max(...targetSectionFields.map(f => f.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('form_fields')
      .insert({
        program_id: programId,
        label: newFieldLabel,
        field_type: newFieldType,
        order: nextOrder,
        section_id: newFieldSectionId,
        options: (newFieldType === 'select' || newFieldType === 'radio' || newFieldType === 'checkbox') ? newFieldOptions.split(',').map(opt => opt.trim()) : null,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add field: ${error.message}`);
    } else if (data) {
      setFields([...fields, data as FormField]);
      setNewFieldLabel('');
      setNewFieldOptions('');
      setNewFieldType('text');
      showSuccess("Field added successfully.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteField = async (fieldId: string) => {
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
    if (error) {
      showError(`Failed to delete field: ${error.message}`);
    } else {
      setFields(fields.filter(f => f.id !== fieldId));
      showSuccess("Field deleted successfully.");
    }
  };

  const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
    setFields(fields => fields.map(f => f.id === fieldId ? { ...f, is_required: isRequired } : f));
    const { error } = await supabase.from('form_fields').update({ is_required: isRequired }).eq('id', fieldId);
    if (error) {
      showError(`Failed to update field: ${error.message}`);
      setFields(fields => fields.map(f => f.id === fieldId ? { ...f, is_required: !isRequired } : f));
    }
  };

  const handleEditLogic = (field: FormField) => {
    setFieldToEditLogic(field);
    setIsLogicBuilderOpen(true);
  };

  const handleSaveLogic = async (fieldId: string, rules: DisplayRule[]) => {
    setFields(prevFields =>
      prevFields.map(f => (f.id === fieldId ? { ...f, display_rules: rules } : f))
    );
    const { error } = await supabase
      .from('form_fields')
      .update({ display_rules: rules })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to save display logic: ${error.message}`);
    } else {
      showSuccess("Display logic saved successfully!");
    }
  };

  const handleEditField = (field: FormField) => {
    setFieldToEditDetails(field);
    setIsEditFieldDialogOpen(true);
  };

  const handleSaveEditedField = async (fieldId: string, values: { label: string; field_type: FormField['field_type']; options?: string; is_required: boolean; }) => {
    const updatedOptions = (values.field_type === 'select' || values.field_type === 'radio' || values.field_type === 'checkbox')
      ? values.options?.split(',').map(opt => opt.trim()) || null
      : null;

    setFields(prevFields =>
      prevFields.map(f =>
        f.id === fieldId
          ? { ...f, label: values.label, field_type: values.field_type, options: updatedOptions, is_required: values.is_required }
          : f
      )
    );

    const { error } = await supabase
      .from('form_fields')
      .update({
        label: values.label,
        field_type: values.field_type,
        options: updatedOptions,
        is_required: values.is_required,
      })
      .eq('id', fieldId);

    if (error) {
      showError(`Failed to update field: ${error.message}`);
    } else {
      showSuccess("Field updated successfully!");
    }
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