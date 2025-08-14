import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import { useFormBuilderState } from "@/hooks/forms/useFormBuilderState";
import { useFormBuilderHandlers } from "@/hooks/forms/useFormBuilderHandlers";
import { useFormBuilderActions } from "@/hooks/forms/useFormBuilderActions"; // Import directly
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
import { SectionPropertiesPanel } from "@/components/forms/form-builder/SectionPropertiesPanel"; // Import new panel
import { FormField, FormSection, Tag } from "@/types"; // Import Tag type
import { FormTagsInput } from "@/components/forms/FormTagsInput"; // Import new component
import { useTagsData } from "@/hooks/tags/useTagsData"; // Import useTagsData

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
    formTags, // Destructure formTags from state
  } = state;

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSection | null>(null); // New state for selected section

  // Fetch all available tags
  const { tags: allAvailableTags, loading: loadingTags } = useTagsData();

  // Initialize actions from the dedicated hook
  const formBuilderActions = useFormBuilderActions({
    formId: state.formId,
    setSections: state.setSections,
    setFields: state.setFields,
    fetchData: state.fetchData,
  });

  const handlers = useFormBuilderHandlers({
    state,
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

  // Sync selected field with the main fields array to ensure panel has fresh data
  useEffect(() => {
    if (selectedField) {
      const updatedFieldFromList = fields.find(f => f.id === selectedField.id);
      if (updatedFieldFromList && JSON.stringify(updatedFieldFromList) !== JSON.stringify(selectedField)) {
        setSelectedField(updatedFieldFromList);
      }
    }
  }, [fields, selectedField]);

  // Sync selected section with the main sections array
  useEffect(() => {
    if (selectedSection) {
      const updatedSectionFromList = sections.find(s => s.id === selectedSection.id);
      if (updatedSectionFromList && JSON.stringify(updatedSectionFromList) !== JSON.stringify(selectedSection)) {
        setSelectedSection(updatedSectionFromList);
      }
    }
  }, [sections, selectedSection]);

  const uncategorizedFields = getFieldsForSection(null);

  const handleQuickAddField = (sectionId: string) => {
    setNewFieldSectionId(sectionId);
    setNewFieldLabel(''); // Clear previous label
    setNewFieldType('text'); // Reset to default type
    setNewFieldOptions(''); // Clear options
    setNewFieldDescription('');
    setNewFieldTooltip('');
    setNewFieldPlaceholder('');
    // Optionally scroll to the add field form
    const addFieldFormElement = document.getElementById('add-field-form');
    if (addFieldFormElement) {
      addFieldFormElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUpdateFormTags = (selectedTagIds: string[]) => {
    if (state.formId) {
      handlers.handleUpdateFormTags(selectedTagIds);
    }
  };

  return (
    <div className="container py-12">
      <Link to="/creator/forms" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Forms
      </Link>

      <FormDetailsCard state={state} />

      <DndContext sensors={combinedSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] border rounded-lg mt-8">
          <ResizablePanel defaultSize={selectedField || selectedSection ? 65 : 100} minSize={30}>
            <div className="p-6 h-full overflow-y-auto">
              <FormSectionsList
                sections={sections}
                fields={fields} // Pass all fields for section logic
                loading={loading}
                getFieldsForSection={getFieldsForSection}
                handleDeleteSection={handlers.handleDeleteSection}
                handleDeleteField={handlers.handleDeleteField}
                handleToggleRequired={handlers.handleToggleRequired}
                onUpdateLabel={handlers.handleUpdateFieldLabel}
                onSelectField={setSelectedField}
                onQuickAddField={handleQuickAddField}
                onSelectSection={setSelectedSection} // Pass new handler
              />

              <UncategorizedFieldsList
                uncategorizedFields={uncategorizedFields}
                handleDeleteField={handlers.handleDeleteField}
                handleToggleRequired={handlers.handleToggleRequired}
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

              <div id="add-field-form"> {/* Add ID for scrolling */}
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
                  isAddingField={isAddingField}
                  handleAddField={handlers.handleAddField}
                  sections={sections}
                />
              </div>
            </div>
          </ResizablePanel>
          {(selectedField || selectedSection) && ( // Conditionally render panel
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={35} minSize={25}>
                {selectedField && (
                  <FieldPropertiesPanel
                    field={selectedField}
                    sections={sections}
                    allFields={fields}
                    onSave={handlers.handleSaveEditedField}
                    onSaveLogic={handlers.handleSaveLogic}
                    onClose={() => setSelectedField(null)}
                  />
                )}
                {selectedSection && (
                  <SectionPropertiesPanel
                    section={selectedSection}
                    allFields={fields} // Pass all fields for section logic
                    onSave={handlers.handleSaveEditedSection}
                    onSaveLogic={handlers.handleSaveSectionLogic} // Pass new handler
                    onClose={() => setSelectedSection(null)}
                  />
                )}
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

      <div className="mt-8 pt-4 border-t">
        <FormTagsInput
          formId={state.formId}
          currentTags={formTags?.map(ft => ft.tag_id) || []}
          allAvailableTags={allAvailableTags.filter(tag => tag.applicable_to.includes('forms'))}
          onTagsChange={handleUpdateFormTags}
          loading={loadingTags}
        />
      </div>

      <FormActions state={state} handlers={handlers} />
    </div>
  );
};

export default FormBuilderPage;