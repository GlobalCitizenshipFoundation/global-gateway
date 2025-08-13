import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import { useFormBuilderState } from "@/hooks/forms/useFormBuilderState";
import { useFormBuilderHandlers } from "@/hooks/forms/useFormBuilderHandlers";
import { useFormBuilderActions } from "@/hooks/forms/useFormBuilderActions";
import { useFormFieldDragAndDrop } from "@/hooks/forms/useFormFieldDragAndDrop"; // Import directly
import { useFormSectionDragAndDrop } from "@/hooks/forms/useFormSectionDragAndDrop"; // Import directly

import { FormDetailsCard } from "@/components/forms/form-builder/FormDetailsCard";
import { FormActions } from "@/components/forms/form-builder/FormActions";
import { AddSectionForm } from "@/components/form-builder/AddSectionForm";
import { AddFieldForm } from "@/components/form-builder/AddFieldForm";
import { FormSectionsList } from "@/components/forms/form-builder/FormSectionsList";
import { UncategorizedFieldsList } from "@/components/forms/form-builder/UncategorizedFieldsList";
import { FormFieldItem } from "@/components/forms/form-builder/FormFieldItem";
import { FieldPropertiesPanel } from "@/components/forms/form-builder/FieldPropertiesPanel";
import { FormField } from "@/types";

const FormBuilderPage = () => {
  const { formId } = useParams<{ formId: string }>();

  const state = useFormBuilderState(formId);
  const {
    sections,
    fields,
    loading,
    getFieldsForSection,
    newSectionName, setNewSectionName,
    newSectionDescription, setNewSectionDescription,
    newSectionTooltip, setNewSectionTooltip,
    isAddingSection, setIsAddingSection,
    newFieldLabel, setNewFieldLabel,
    newFieldType, setNewFieldType,
    newFieldOptions, setNewFieldOptions,
    newFieldSectionId, setNewFieldSectionId,
    newFieldDescription, setNewFieldDescription,
    newFieldTooltip, setNewFieldTooltip,
    newFieldPlaceholder, setNewFieldPlaceholder,
    isAddingField, setIsAddingField,
    setHasUnsavedChanges,
    fetchData,
    setSections,
    setFields,
  } = state;

  const [selectedField, setSelectedField] = useState<FormField | null>(null);

  // Initialize actions from the dedicated hook
  const formBuilderActions = useFormBuilderActions({
    formId: state.formId,
    setSections: state.setSections,
    setFields: state.setFields,
    fetchData: state.fetchData,
  });

  const handlers = useFormBuilderHandlers({
    state,
    // No longer passing performUpdateFormDetails/Status directly here
    // as useFormBuilderHandlers will access them from formBuilderActions internally
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
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
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
                onEditLogic={(field) => setSelectedField(field)}
                onEditField={(field) => setSelectedField(field)}
                onUpdateLabel={handlers.handleUpdateFieldLabel}
                onSelectField={setSelectedField}
              />

              <UncategorizedFieldsList
                uncategorizedFields={uncategorizedFields}
                handleDeleteField={handlers.handleDeleteField}
                handleToggleRequired={handlers.handleToggleRequired}
                onEditLogic={(field) => setSelectedField(field)}
                onEditField={(field) => setSelectedField(field)}
                onUpdateLabel={handlers.handleUpdateFieldLabel}
                onSelectField={setSelectedField}
              />

              <AddSectionForm
                newSectionName={newSectionName}
                setNewSectionName={setNewSectionName}
                newSectionDescription={newSectionDescription}
                setNewSectionDescription={setNewSectionDescription}
                newSectionTooltip={newSectionTooltip}
                setNewSectionTooltip={setNewSectionTooltip}
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
                  allFields={fields}
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
              onSelectField={() => {}}
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