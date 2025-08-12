import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';

// Import new modular components and hooks
import { useFormBuilderState } from "@/hooks/useFormBuilderState";
import { useFormBuilderHandlers } from "@/hooks/useFormBuilderHandlers";
import { useFormBuilderActions } from "@/hooks/useFormBuilderActions"; // Keep actions for handlers to use
import { useFormFieldDragAndDrop } from "@/hooks/useFormFieldDragAndDrop";
import { useFormSectionDragAndDrop } from "@/hooks/useFormSectionDragAndDrop";

import { FormDetailsCard } from "@/components/form-builder/FormDetailsCard";
import { FormActions } from "@/components/form-builder/FormActions";
import { AddSectionForm } from "@/components/form-builder/AddSectionForm";
import { AddFieldForm } from "@/components/form-builder/AddFieldForm";
import { FormSectionsList } from "@/components/form-builder/FormSectionsList";
import { UncategorizedFieldsList } from "@/components/form-builder/UncategorizedFieldsList";
import { FormFieldItem } from "@/components/FormFieldItem"; // For DragOverlay
import ConditionalLogicBuilder from "@/components/ConditionalLogicBuilder";
import EditFormFieldDialog from "@/components/EditFormFieldDialog";

const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>();

  // Use the state hook
  const state = useFormBuilderState(formId);
  const {
    sections,
    fields,
    loading,
    getFieldsForSection,
    isLogicBuilderOpen, setIsLogicBuilderOpen,
    fieldToEditLogic, setFieldToEditLogic,
    isEditFieldDialogOpen, setIsEditFieldDialogOpen,
    fieldToEditDetails, setFieldToEditDetails,
    newSectionName, setNewSectionName,
    isAddingSection, setIsAddingSection,
    newFieldLabel, setNewFieldLabel,
    newFieldType, setNewFieldType,
    newFieldOptions, setNewFieldOptions,
    newFieldSectionId, setNewFieldSectionId,
    newFieldHelpText, setNewFieldHelpText,
    newFieldDescription, setNewFieldDescription,
    newFieldTooltip, setNewFieldTooltip,
    newFieldPlaceholder, setNewFieldPlaceholder,
    isAddingField, setIsAddingField,
    setHasUnsavedChanges,
    fetchData, // Pass fetchData to handlers
    setSections, // Pass setSections to handlers
    setFields, // Pass setFields to handlers
  } = state;

  // Initialize actions (these are pure data operations)
  const formBuilderActions = useFormBuilderActions({
    formId: state.formId,
    setSections: state.setSections,
    setFields: state.setFields,
    fetchData: state.fetchData,
  });

  // Use the handlers hook, passing state and actions
  const handlers = useFormBuilderHandlers({
    state,
    performUpdateFormDetails: formBuilderActions.handleUpdateFormDetails,
    performUpdateFormStatus: formBuilderActions.handleUpdateFormStatus,
  });

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

  // Warning for unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.hasUnsavedChanges]);

  const uncategorizedFields = getFieldsForSection(null);

  return (
    <div className="container py-12">
      <Link to="/creator/forms" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Forms
      </Link>

      <FormDetailsCard state={state} />

      <DndContext sensors={combinedSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <FormSectionsList
          sections={sections}
          fields={fields}
          loading={loading}
          getFieldsForSection={getFieldsForSection}
          handleDeleteSection={handlers.handleDeleteSection}
          handleDeleteField={handlers.handleDeleteField}
          handleToggleRequired={handlers.handleToggleRequired}
          onEditLogic={handlers.handleEditLogic}
          onEditField={handlers.handleEditField}
          onUpdateLabel={handlers.handleUpdateFieldLabel}
        />

        <UncategorizedFieldsList
          uncategorizedFields={uncategorizedFields}
          handleDeleteField={handlers.handleDeleteField}
          handleToggleRequired={handlers.handleToggleRequired}
          onEditLogic={handlers.handleEditLogic}
          onEditField={handlers.handleEditField}
          onUpdateLabel={handlers.handleUpdateFieldLabel}
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

      <AddSectionForm
        newSectionName={newSectionName}
        setNewSectionName={setNewSectionName}
        isSubmitting={isAddingSection}
        handleAddSection={handlers.handleAddSection}
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
        newFieldPlaceholder={newFieldPlaceholder}
        setNewFieldPlaceholder={setNewFieldPlaceholder}
        isSubmitting={isAddingField}
        handleAddField={handlers.handleAddField}
        sections={sections}
      />

      <FormActions state={state} handlers={handlers} />

      <ConditionalLogicBuilder
        isOpen={isLogicBuilderOpen}
        onClose={() => setIsLogicBuilderOpen(false)}
        fieldToEdit={fieldToEditLogic}
        allFields={fields}
        onSave={handlers.handleSaveLogic}
      />

      <EditFormFieldDialog
        isOpen={isEditFieldDialogOpen}
        onClose={() => setIsEditFieldDialogOpen(false)}
        fieldToEdit={fieldToEditDetails}
        onSave={handlers.handleSaveEditedField}
        sections={sections}
      />
    </div>
  );
};

export default FormBuilderPage;