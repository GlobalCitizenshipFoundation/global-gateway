import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

// Import new modular components and hooks
import { useFormBuilderState } from "@/hooks/useFormBuilderState";
import { useFormBuilderHandlers } from "@/hooks/useFormBuilderHandlers";
import { useFormBuilderActions } from "@/hooks/useFormBuilderActions";
import { useFormFieldDragAndDrop } from "@/hooks/useFormFieldDragAndDrop";
import { useFormSectionDragAndDrop } from "@/hooks/useFormSectionDragAndDrop";

import { FormDetailsCard } from "@/components/form-builder/FormDetailsCard";
import { FormActions } from "@/components/form-builder/FormActions";
import { AddSectionForm } from "@/components/form-builder/AddSectionForm";
import { AddFieldForm } from "@/components/form-builder/AddFieldForm";
import { FormSectionsList } from "@/components/form-builder/FormSectionsList";
import { UncategorizedFieldsList } from "@/components/form-builder/UncategorizedFieldsList";
import { FormFieldItem } from "@/components/FormFieldItem"; // For DragOverlay
import { FieldPropertiesPanel } from "@/components/form-builder/FieldPropertiesPanel"; // New import
import { FormField } from "@/types"; // Import FormField type

const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>();

  // Use the state hook
  const state = useFormBuilderState(formId);
  const {
    sections,
    fields,
    loading,
    getFieldsForSection,
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
    fetchData,
    setSections,
    setFields,
  } = state;

  // State for the currently selected field in the properties panel
  const [selectedField, setSelectedField] = useState<FormField | null>(null);

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
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] border rounded-lg mt-8">
          <ResizablePanel defaultSize={selectedField ? 65 : 100} minSize={30}>
            <div className="p-6 h-full overflow-y-auto">
              <FormSectionsList
                sections={sections}
                fields={fields}
                loading={loading}
                getFieldsForSection={getFieldsForSection}
                handleDeleteSection={handlers.handleDeleteSection}
                handleDeleteField={handlers.handleDeleteField}
                handleToggleRequired={handlers.handleToggleRequired}
                onEditLogic={(field) => setSelectedField(field)} // Set selected field to open panel
                onEditField={(field) => setSelectedField(field)} // Set selected field to open panel
                onUpdateLabel={handlers.handleUpdateFieldLabel}
                onSelectField={setSelectedField} // Pass new prop
              />

              <UncategorizedFieldsList
                uncategorizedFields={uncategorizedFields}
                handleDeleteField={handlers.handleDeleteField}
                handleToggleRequired={handlers.handleToggleRequired}
                onEditLogic={(field) => setSelectedField(field)} // Set selected field to open panel
                onEditField={(field) => setSelectedField(field)} // Set selected field to open panel
                onUpdateLabel={handlers.handleUpdateFieldLabel}
                onSelectField={setSelectedField} // Pass new prop
              />

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
            </div>
          </ResizablePanel>
          {selectedField && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={35} minSize={25}>
                <FieldPropertiesPanel
                  field={selectedField}
                  sections={sections}
                  allFields={fields} // Pass all fields for conditional logic
                  onSave={handlers.handleSaveEditedField}
                  onSaveLogic={handlers.handleSaveLogic}
                  onClose={() => setSelectedField(null)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>

        <DragOverlay>
          {activeFieldDragItem ? (
            <FormFieldItem
              field={activeFieldDragItem}
              onDelete={() => {}}
              onToggleRequired={() => {}}
              onUpdateLabel={() => {}}
              onSelectField={() => {}} // Dummy for overlay
            />
          ) : activeSectionDragItem ? (
            <div className="p-4 bg-secondary rounded-md shadow-lg cursor-grabbing">
              <span className="font-semibold">{activeSectionDragItem.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <FormActions state={state} handlers={handlers} />
    </div>
  );
};

export default FormBuilderPage;