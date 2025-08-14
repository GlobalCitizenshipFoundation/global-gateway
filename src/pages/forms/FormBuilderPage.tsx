import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, DragOverlay, closestCenter, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

import { useFormBuilderState } from "@/hooks/forms/useFormBuilderState";
import { useFormBuilderHandlers } from "@/hooks/forms/useFormBuilderHandlers";
import { useFormFieldDragAndDrop } from "@/hooks/forms/useFormFieldDragAndDrop";
import { useFormSectionDragAndDrop } from "@/hooks/forms/useFormSectionDragAndDrop";

import { FormDetailsCard } from "@/components/forms/form-builder/FormDetailsCard";
import { FormActions } from "@/components/forms/form-builder/FormActions";
import { AddSectionForm } from "@/components/form-builder/AddSectionForm";
import { AddFieldForm } from "@/components/form-builder/AddFieldForm";
import { FormSectionsList } from "@/components/forms/form-builder/FormSectionsList";
import { UncategorizedFieldsList } from "@/components/forms/form-builder/UncategorizedFieldsList";
import { FormFieldItem } from "@/components/forms/form-builder/FormFieldItem";
import { FieldPropertiesPanel } from "@/components/forms/form-builder/FieldPropertiesPanel";
import { SectionPropertiesPanel } from "@/components/forms/form-builder/SectionPropertiesPanel";
import { FormField, FormSection, Tag } from "@/types";
import { FormTagsInput } from "@/components/forms/FormTagsInput";
import { useTagsData } from "@/hooks/tags/useTagsData";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react"; // Explicit React import

const FormBuilderPage = () => {
  const { formId: paramFormId } = useParams<{ formId: string }>();

  const state = useFormBuilderState(paramFormId);
  const {
    formId,
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
    formTags,
    selectedField, setSelectedField,
    selectedSection, setSelectedSection,
  } = state;

  const { tags: allAvailableTags, loading: loadingTags } = useTagsData();

  const handlers = useFormBuilderHandlers({ state });

  const {
    sensors: fieldSensors,
    onDragStart: onFieldDragStart,
    onDragEnd: onFieldDragEnd,
    activeDragItem: activeFieldDragItem,
  } = useFormFieldDragAndDrop({ fields, setFields: state.setFields, sections, fetchData });

  const {
    sensors: sectionSensors,
    onDragStart: onSectionDragStart,
    onDragEnd: onSectionDragEnd,
    activeDragItem: activeSectionDragItem,
  } = useFormSectionDragAndDrop({ sections, setSections: state.setSections, fetchData });

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

  useEffect(() => {
    if (selectedField) {
      const updatedFieldFromList = fields.find((f: FormField) => f.id === selectedField.id);
      if (updatedFieldFromList && JSON.stringify(updatedFieldFromList) !== JSON.stringify(selectedField)) {
        setSelectedField(updatedFieldFromList);
      }
    }
  }, [fields, selectedField, setSelectedField]);

  useEffect(() => {
    if (selectedSection) {
      const updatedSectionFromList = sections.find((s: FormSection) => s.id === selectedSection.id);
      if (updatedSectionFromList && JSON.stringify(updatedSectionFromList) !== JSON.stringify(selectedSection)) {
        setSelectedSection(updatedSectionFromList);
      }
    }
  }, [sections, selectedSection, setSelectedSection]);

  const uncategorizedFields = getFieldsForSection(null);

  const handleQuickAddField = (sectionId: string) => {
    setNewFieldSectionId(sectionId);
    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldOptions('');
    setNewFieldDescription('');
    setNewFieldTooltip('');
    setNewFieldPlaceholder('');
    const addFieldFormElement = document.getElementById('add-field-form');
    if (addFieldFormElement) {
      addFieldFormElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUpdateFormTags = (selectedTagIds: string[]) => {
    if (formId) {
      handlers.handleUpdateFormTags(selectedTagIds);
    }
  };

  if (loading) return <div className="container py-12"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="container py-12">
      <Link to="/creator/forms" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Forms
      </Link>

      <FormDetailsCard state={state} handlers={handlers} />

      <DndContext sensors={combinedSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] border rounded-lg mt-8">
          <ResizablePanel defaultSize={selectedField || selectedSection ? 65 : 100} minSize={30}>
            <div className="p-6 h-full overflow-y-auto">
              <FormSectionsList
                sections={sections}
                fields={fields}
                loading={loading}
                getFieldsForSection={getFieldsForSection}
                handleDeleteSection={handlers.handleDeleteSection}
                handleDeleteField={handlers.handleDeleteField}
                handleToggleRequired={handlers.handleToggleRequired}
                onUpdateLabel={handlers.handleUpdateFieldLabel}
                onSelectField={setSelectedField}
                onQuickAddField={handleQuickAddField}
                onSelectSection={setSelectedSection}
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

              <div id="add-field-<dyad-problem-report summary="100 problems">
<problem file="src/components/application/FormFieldRenderer.tsx" line="14" column="39" code="1005">'from' expected.</problem>
<problem file="src/components/forms/form-builder/SectionPropertiesPanel.tsx" line="22" column="39" code="1005">'from' expected.</problem>
<problem file="src/components/review/DynamicReviewForm.tsx" line="18" column="39" code="1005">'from' expected.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="225" column="23" code="1005">';' expected.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="228" column="5" code="1128">Declaration or statement expected.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="228" column="7" code="1005">'try' expected.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="233" column="3" code="1128">Declaration or statement expected.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="578" column="1" code="1128">Declaration or statement expected.</problem>
<problem file="src/types/index.ts" line="241" column="10" code="2552">Cannot find name 'EvaluationTemplateTag'. Did you mean 'EvaluationTemplate'?</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="13" column="6" code="2304">Cannot find name 'Card'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="14" column="8" code="2304">Cannot find name 'CardHeader'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="15" column="10" code="2304">Cannot find name 'CardTitle'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="15" column="62" code="2304">Cannot find name 'CardTitle'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="16" column="10" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="16" column="49" code="2304">Cannot find name 'CardDescription'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="17" column="9" code="2304">Cannot find name 'CardHeader'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="18" column="8" code="2304">Cannot find name 'CardContent'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="23" column="9" code="2304">Cannot find name 'CardContent'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="24" column="8" code="2304">Cannot find name 'CardFooter'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="28" column="9" code="2304">Cannot find name 'CardFooter'.</problem>
<problem file="src/components/programs/ProgramCard.tsx" line="29" column="7" code="2304">Cannot find name 'Card'.</problem>
<problem file="src/components/ui/form.tsx" line="167" column="3" code="2304">Cannot find name 'Form'.</problem>
<problem file="src/components/ui/calendar.tsx" line="13" column="3" code="2339">Property 'showHead' does not exist on type 'DayPickerDefaultProps | DayPickerSingleProps | DayPickerMultipleProps | DayPickerRangeProps'.</problem>
<problem file="src/components/ui/calendar.tsx" line="19" column="7" code="2322">Type '{ mode?: &quot;default&quot; | undefined; modifiersClassNames?: ModifiersClassNames | undefined; style?: CSSProperties | undefined; styles?: Partial&lt;Omit&lt;StyledElement&lt;...&gt;, InternalModifiersElement&gt;&gt; | undefined; ... 57 more ...; classNames: { ...; }; } | { ...; } | { ...; } | { ...; }' is not assignable to type 'IntrinsicAttributes &amp; (DayPickerDefaultProps | DayPickerSingleProps | DayPickerMultipleProps | DayPickerRangeProps)'.
  Type '{ mode?: &quot;default&quot; | undefined; modifiersClassNames?: ModifiersClassNames | undefined; style?: CSSProperties | undefined; styles?: Partial&lt;Omit&lt;StyledElement&lt;CSSProperties&gt;, InternalModifiersElement&gt;&gt; | undefined; ... 57 more ...; classNames: { ...; }; }' is not assignable to type 'IntrinsicAttributes &amp; (DayPickerDefaultProps | DayPickerSingleProps | DayPickerMultipleProps | DayPickerRangeProps)'.
    Property 'showHead' does not exist on type 'IntrinsicAttributes &amp; DayPickerDefaultProps'.</problem>
<problem file="src/components/application/FormFieldRenderer.tsx" line="14" column="39" code="1141">String literal expected.</problem>
<problem file="src/components/application/ApplicationFormSections.tsx" line="29" column="61" code="2304">Cannot find name 'DisplayRule'.</problem>
<problem file="src/components/application/ApplicationFormSections.tsx" line="36" column="40" code="2304">Cannot find name 'DisplayRule'.</problem>
<problem file="src/components/application/ApplicationFormSections.tsx" line="36" column="68" code="2304">Cannot find name 'DisplayRule'.</problem>
<problem file="src/components/application/ApplicationFormSections.tsx" line="38" column="40" code="2304">Cannot find name 'DisplayRule'.</problem>
<problem file="src/components/application/ApplicationFormSections.tsx" line="38" column="67" code="2304">Cannot find name 'DisplayRule'.</problem>
<problem file="src/pages/applications/ApplyPage.tsx" line="74" column="48" code="2339">Property 'id' does not exist on type 'never'.</problem>
<problem file="src/pages/applications/ApplyPage.tsx" line="75" column="20" code="2339">Property 'id' does not exist on type 'never'.</problem>
<problem file="src/pages/applications/ApplyPage.tsx" line="76" column="71" code="2339">Property 'id' does not exist on type 'never'.</problem>
<problem file="src/components/review/DynamicReviewForm.tsx" line="18" column="39" code="1141">String literal expected.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="126" column="17" code="2352">Conversion of type '{ title: any; form_id: any; allow_pdf_download: any; }[]' to type '{ title: string; form_id: string | null; allow_pdf_download: boolean; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ title: any; form_id: any; allow_pdf_download: any; }[]' is missing the following properties from type '{ title: string; form_id: string | null; allow_pdf_download: boolean; }': title, form_id, allow_pdf_download</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="127" column="23" code="2352">Conversion of type '{ name: any; evaluation_template_id: any; description: any; step_type: any; }[]' to type '{ name: string; evaluation_template_id: string | null; description: string | null; step_type: &quot;form&quot; | &quot;status&quot; | &quot;email&quot; | &quot;screening&quot; | &quot;review&quot; | &quot;resubmission&quot; | &quot;decision&quot; | &quot;scheduling&quot; | &quot;recommendation&quot;; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ name: any; evaluation_template_id: any; description: any; step_type: any; }[]' is missing the following properties from type '{ name: string; evaluation_template_id: string | null; description: string | null; step_type: &quot;form&quot; | &quot;status&quot; | &quot;email&quot; | &quot;screening&quot; | &quot;review&quot; | &quot;resubmission&quot; | &quot;decision&quot; | &quot;scheduling&quot; | &quot;recommendation&quot;; }': name, evaluation_template_id, description, step_type</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="133" column="7" code="2304">Cannot find name 'showError'.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="144" column="26" code="2304">Cannot find name 'showError'.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="151" column="7" code="2304">Cannot find name 'showError'.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="169" column="9" code="2304">Cannot find name 'showError'.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="176" column="7" code="2304">Cannot find name 'showError'.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="179" column="29" code="2345">Argument of type '(res: { value: string | null; form_fields: FormField | null; }) =&gt; void' is not assignable to parameter of type '(value: { value: any; form_fields: { id: any; label: any; field_type: any; options: any; is_required: any; order: any; display_rules: any; description: any; tooltip: any; }[]; }, index: number, array: { value: any; form_fields: { ...; }[]; }[]) =&gt; void'.
  Types of parameters 'res' and 'value' are incompatible.
    Type '{ value: any; form_fields: { id: any; label: any; field_type: any; options: any; is_required: any; order: any; display_rules: any; description: any; tooltip: any; }[]; }' is not assignable to type '{ value: string | null; form_fields: FormField | null; }'.
      Types of property 'form_fields' are incompatible.
        Type '{ id: any; label: any; field_type: any; options: any; is_required: any; order: any; display_rules: any; description: any; tooltip: any; }[]' is missing the following properties from type 'FormField': id, form_id, section_id, label, and 20 more.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="240" column="7" code="2304">Cannot find name 'showError'.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="244" column="7" code="2304">Cannot find name 'showSuccess'.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="269" column="7" code="2304">Cannot find name 'showError'.</problem>
<problem file="src/pages/review/SubmissionDetailPage.tsx" line="271" column="7" code="2304">Cannot find name 'showSuccess'.</problem>
<problem file="src/components/ui/resizable.tsx" line="23" column="46" code="2339">Property 'PanelHandle' does not exist on type 'typeof import(&quot;/Users/aaryan/dyad-apps/aug-25-ats/node_modules/.pnpm/react-resizable-panels@2.1.7_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-resizable-panels/dist/react-resizable-panels.cjs&quot;)'.</problem>
<problem file="src/components/ui/resizable.tsx" line="24" column="60" code="2339">Property 'PanelHandle' does not exist on type 'typeof import(&quot;/Users/aaryan/dyad-apps/aug-25-ats/node_modules/.pnpm/react-resizable-panels@2.1.7_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-resizable-panels/dist/react-resizable-panels.cjs&quot;)'.</problem>
<problem file="src/components/ui/resizable.tsx" line="26" column="23" code="2339">Property 'PanelHandle' does not exist on type 'typeof import(&quot;/Users/aaryan/dyad-apps/aug-25-ats/node_modules/.pnpm/react-resizable-panels@2.1.7_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-resizable-panels/dist/react-resizable-panels.cjs&quot;)'.</problem>
<problem file="src/components/ui/resizable.tsx" line="39" column="24" code="2339">Property 'PanelHandle' does not exist on type 'typeof import(&quot;/Users/aaryan/dyad-apps/aug-25-ats/node_modules/.pnpm/react-resizable-panels@2.1.7_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-resizable-panels/dist/react-resizable-panels.cjs&quot;)'.</problem>
<problem file="src/components/ui/resizable.tsx" line="42" column="50" code="2339">Property 'PanelHandle' does not exist on type 'typeof import(&quot;/Users/aaryan/dyad-apps/aug-25-ats/node_modules/.pnpm/react-resizable-panels@2.1.7_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/react-resizable-panels/dist/react-resizable-panels.cjs&quot;)'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="217" column="78" code="2366">Function lacks ending return statement and return type does not include 'undefined'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="225" column="15" code="7031">Binding element 'error' implicitly has an 'any' type.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="225" column="83" code="2304">Cannot find name 'isRequired'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="225" column="98" code="2304">Cannot find name 'metadata'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="225" column="119" code="2304">Cannot find name 'fieldId'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="226" column="11" code="2304">Cannot find name 'error'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="226" column="24" code="2304">Cannot find name 'error'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="230" column="13" code="2304">Cannot find name 'fetchData'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="236" column="10" code="2304">Cannot find name 'user'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="241" column="24" code="2304">Cannot find name 'createMetadata'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="248" column="13" code="2304">Cannot find name 'fetchData'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="252" column="13" code="2304">Cannot find name 'fetchData'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="276" column="10" code="2304">Cannot find name 'user'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="285" column="24" code="2304">Cannot find name 'createMetadata'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="329" column="13" code="2304">Cannot find name 'fetchData'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="333" column="13" code="2304">Cannot find name 'fetchData'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="339" column="10" code="2304">Cannot find name 'user'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="344" column="7" code="2304">Cannot find name 'setFields'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="344" column="17" code="7006">Parameter 'prevFields' implicitly has an 'any' type.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="347" column="24" code="2304">Cannot find name 'createMetadata'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="357" column="13" code="2304">Cannot find name 'fetchData'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="363" column="10" code="2304">Cannot find name 'user'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="368" column="24" code="2304">Cannot find name 'createMetadata'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="383" column="10" code="2304">Cannot find name 'user'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="388" column="24" code="2304">Cannot find name 'createMetadata'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="407" column="10" code="2304">Cannot find name 'user'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="414" column="24" code="2304">Cannot find name 'createMetadata'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="416" column="18" code="2304">Cannot find name 'user'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="522" column="10" code="2304">Cannot find name 'user'.</problem>
<problem file="src/hooks/forms/useFormBuilderActions.ts" line="527" column="24" code="2304">Cannot find name 'createMetadata'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="54" column="5" code="2339">Property 'handleAddSection' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="55" column="5" code="2339">Property 'handleDeleteSection' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="56" column="5" code="2339">Property 'handleSaveEditedSection' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="57" column="5" code="2339">Property 'handleSaveSectionLogic' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="58" column="5" code="2339">Property 'handleAddField' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="59" column="5" code="2339">Property 'handleDeleteField' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="60" column="5" code="2339">Property 'handleToggleRequired' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="61" column="5" code="2339">Property 'handleSaveLogic' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="62" column="5" code="2339">Property 'handleSaveEditedField' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="63" column="5" code="2339">Property 'handleUpdateFieldLabel' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="64" column="5" code="2339">Property 'handleUpdateFormStatus' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="65" column="5" code="2339">Property 'handleUpdateFormDetails' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="66" column="5" code="2339">Property 'handleSaveAsTemplate' does not exist on type 'void'.</problem>
<problem file="src/hooks/forms/useFormBuilderHandlers.ts" line="67" column="5" code="2339">Property 'handleUpdateFormTags' does not exist on type 'void'.</problem>
<problem file="src/components/forms/form-builder/SectionPropertiesPanel.tsx" line="22" column="39" code="1141">String literal expected.</problem>
<problem file="src/pages/forms/FormBuilderPage.tsx" line="180" column="16" code="2739">Type '{ uncategorizedFields: FormField[]; handleDeleteField: (fieldId: string) =&gt; Promise&lt;void&gt;; handleToggleRequired: (fieldId: string, isRequired: boolean) =&gt; Promise&lt;void&gt;; onUpdateLabel: (fieldId: string, newLabel: string) =&gt; Promise&lt;...&gt;; onSelectField: (field: FormField | null) =&gt; void; }' is missing the following properties from type 'UncategorizedFieldsListProps': onEditLogic, onEditField</problem>
<problem file="src/components/form-builder/FieldPropertiesPanel.tsx" line="11" column="33" code="2307">Cannot find module './field-properties/BasicProperties' or its corresponding type declarations.</problem>
<problem file="src/components/form-builder/FieldPropertiesPanel.tsx" line="12" column="32" code="2307">Cannot find module './field-properties/DateProperties' or its corresponding type declarations.</problem>
<problem file="src/components/form-builder/FieldPropertiesPanel.tsx" line="13" column="34" code="2307">Cannot find module './field-properties/RatingProperties' or its corresponding type declarations.</problem>
</dyad-problem-report><think>**Addressing Compile-Time Errors**

I've determined a large number of TypeScript errors persist despite a rebuild. This suggests a problem within the TypeScript configuration or module resolution. Current focus: analyzing the recurring "from" expected (TS1005) syntax error.


**Isolating TypeScript Issues**

I've isolated the TypeScript issues into several key categories. The `'from' expected` and `Declaration or statement expected` errors are common and likely stem from incorrect import syntax.  I'm focusing on the "cannot find name" and "property does not exist" errors, which point to issues with type definitions, imports, and prop mismatches.


**Diagnosing Configuration Problems**

I'm now zeroing in on the root causes. The persistent "from" expected errors and declaration errors clearly point to misconfigured imports.  "Cannot find name" errors suggest type definition issues within our project's modules, particularly in  `src/types/index.ts`. I also suspect incorrect imports or exports in `src/components/ui/card.tsx`. The "property does not exist" errors, meanwhile, highlight type mismatches between components and their props, particularly with the `react-day-picker` library.  Lastly, the issues with the missing globals strongly imply a fundamental `lib` configuration issue in the `tsconfig.json` which is now my central focus.


**Focusing on Global Types**

I've determined the primary issue is the missing global type definitions, which are causing a cascade of errors. This points directly to a misconfiguration within the `tsconfig.json` file, particularly the `lib` and `types` options. My next step involves providing a complete `tsconfig.json` with recommended settings to resolve this core problem. After that, I will address specific syntax errors.


**Addressing Underlying Config Issues**

I'm now zeroing in on the root cause. The "from" expected errors and declaration errors clearly point to misconfigured imports. The persistent global type errors strongly suggest `lib` configuration problems in the `tsconfig.json`. I'm preparing a complete `tsconfig.json` to resolve these foundational issues, and then tackle the specific syntax errors that remain. My focus is now on ensuring a correct project-wide configuration.


**Refining Configuration Strategy**

I'm now revising my approach. Addressing the `tsconfig.json` directly is the primary goal, especially the `lib` and `types` options. After that, I will address specific syntax and type errors based on the recommendations. I will provide a minimal and a comprehensive `tsconfig.json` file for the user.


**Finalizing Configuration Settings**

I'm now revising my approach. Addressing the `tsconfig.json` directly is the primary goal, especially the `lib` and `types` options. After that, I will address specific syntax and type errors based on the recommendations. I will provide a minimal and a comprehensive `tsconfig.json` file for the user.


**Prioritizing TsConfig Remediation**

I've determined the most effective approach involves providing a complete `tsconfig.json` file. This should resolve the recurring "from" syntax errors, as well as the missing global types like `String`, `Number`, and `URL`. I'll also address the incorrect imports. Following the `tsconfig.json` update, I'll then move to resolve the type discrepancies in `react-day-picker`.


**Analyzing Strategy Refinements**

I've determined I need a more specific strategy. Addressing the `tsconfig.json` remains paramount, particularly the `lib` and `types` options. After that, I will tackle the "from" syntax errors, fix `DayPicker` props, and ensure React is properly imported. I will also make type-safe corrections within the `src/hooks/forms/useFormBuilderActions.ts` file, and improve the logic surrounding `appData`. After completing these revisions, I will guide the user to rebuild their project.


</think>It sounds like the TypeScript compiler is having trouble resolving fundamental types and modules, even after a rebuild. This often points to an issue with the `tsconfig.json` configuration, which dictates how TypeScript compiles your project.

The errors like "Cannot find module 'sonner'", "Cannot find name 'Date'", "Property 'filter' does not exist on type '{}'", and "from' expected" are strong indicators that the compiler isn't correctly including standard library types or resolving installed package type declarations.

**First, and most critically, you need to ensure your `tsconfig.json` is correctly configured.** This file tells TypeScript which libraries and type definitions to include. Please update your `tsconfig.json` file to include the following `compilerOptions`. If you have an existing `tsconfig.json`, make sure these specific `lib` and `types` entries are present and correct.

```json
// In your tsconfig.json file, under "compilerOptions":
{
  "compilerOptions": {
    // ... other existing options (like "target", "module", "jsx", "strict", etc.)
    "lib": ["dom", "es2015", "es2016", "es2017", "es2018", "es2019", "es2020", "es2021", "es2022", "esnext"], // Ensures modern JS features and DOM APIs are recognized
    "types": [
      "node", // For NodeJS specific types like `NodeJS.Timeout`
      "vite/client", // For Vite-specific environment types
      // Explicitly list @types packages for your dependencies.
      // Ensure these are installed in your node_modules/@types directory.
      "@types/react",
      "@types/react-dom",
      "@types/sonner",
      "@types/clsx",
      "@types/tailwind-merge",
      "@types/react-quill",
      "@types/html2canvas",
      "@types/jspdf",
      "@types/embla-carousel-react",
      "@types/input-otp",
      "@types/cmdk",
      "@types/recharts",
      "@types/vaul",
      "@types/class-variance-authority",
      "@types/date-fns",
      "@types/react-day-picker",
      "@types/react-resizable-panels",
      "@types/react-router-dom",
      "@types/react-hot-toast",
      "@types/zod",
      "@types/react-hook-form",
      "@types/next-themes",
      "@types/lucide-react",
      "@types/dompurify",
      "@types/react-select",
      "@types/react-radio-group",
      "@types/react-popover",
      "@types/react-checkbox",
      "@types/react-slider",
      "@types/react-separator",
      "@types/react-dialog",
      "@types/react-dropdown-menu",
      "@types/react-accordion",
      "@types/react-switch",
      "@types/react-collapsible",
      "@types/react-context-menu",
      "@types/react-hover-card",
      "@types/react-menubar",
      "@types/react-navigation-menu",
      "@types/react-progress",
      "@types/react-tabs",
      "@types/react-toggle",
      "@types/react-toggle-group",
      "@types/react-tooltip",
      "@types/react-avatar",
      "@types/react-label",
      "@types/react-slot",
      "@types/supabase__supabase-js",
      "@types/supabase__auth-ui-react",
      "@types/supabase__auth-ui-shared",
      "@types/tanstack__react-query"
    ],
    "noImplicitAny": true // Keep this for strictness
  }
}
```

**After you've updated your `tsconfig.json` file and saved it**, I will apply the following targeted code fixes to address the remaining explicit type issues and syntax problems.

Here are the code modifications:

<dyad-write path="src/components/application/FormFieldRenderer.tsx" description="Correcting import syntax for RadioGroup and adding explicit types.">
import { FormField } from "@/types";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import RichTextEditor from "@/components/common/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import DOMPurify from 'dompurify';
import { Slider } from "@/components/ui/slider";

interface FormFieldRendererProps {
  field: FormField;
  submitting: boolean;
}

type DynamicFormValues = Record<string, string | string[] | number | undefined | null>;

const FormFieldRenderer = ({ field, submitting }: FormFieldRendererProps) => {
  const { control } = useFormContext<DynamicFormValues>();
  const hasTooltip = field.tooltip && field.tooltip.trim() !== '';
  const sanitizedDescription = field.description ? DOMPurify.sanitize(field.description, { USE_PROFILES: { html: true } }) : null;

  return (
    <FormFieldComponent
      key={field.id}
      control={control}
      name={field.id as keyof DynamicFormValues}
      render={({ field: formHookField }) => (
        <FormItem className="grid gap-2">
          <div className="flex items-center gap-2">
            <FormLabel htmlFor={field.id} className="text-lg font-semibold">
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            {hasTooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" align="center">
                  <p>{field.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {sanitizedDescription && <FormDescription className="text-sm text-muted-foreground"><div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} className="prose max-w-none" /></FormDescription>}
          {field.field_type === 'textarea' ? (
            <FormControl>
              <Textarea
                id={field.id}
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                className="min-h-[120px] resize-y"
                placeholder={field.placeholder || undefined}
              />
            </FormControl>
          ) : field.field_type === 'select' ? (
            <FormControl>
              <Select
                onValueChange={formHookField.onChange}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder={field.placeholder || `Select an option`} />
                </SelectTrigger>
                <SelectContent>
                  {(field.options || []).map((option: string, index: number) => (
                    <SelectItem key={index} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          ) : field.field_type === 'radio' ? (
            <FormControl>
              <RadioGroup
                onValueChange={formHookField.onChange}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                className="space-y-2"
              >
                {(field.options || []).map((option: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                    <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
          ) : field.field_type === 'checkbox' ? (
            <div className="space-y-2">
              {(field.options || []).map((option: string, index: number) => (
                <FormFieldComponent
                  key={option}
                  control={control}
                  name={field.id as keyof DynamicFormValues}
                  render={({ field: checkboxField }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={Array.isArray(checkboxField.value) && (checkboxField.value as string[]).includes(option)}
                          onCheckedChange={(checked: boolean) => {
                            const currentValues = Array.isArray(checkboxField.value) ? checkboxField.value : [];
                            return checked
                              ? checkboxField.onChange([...currentValues, option])
                              : checkboxField.onChange(
                                  currentValues.filter(
                                    (value: string) => value !== option
                                  )
                                );
                          }}
                          disabled={submitting}
                        />
                      </FormControl>
                      <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          ) : field.field_type === 'email' ? (
            <FormControl>
              <Input
                id={field.id}
                type="email"
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined}
              />
            </FormControl>
          ) : field.field_type === 'date' ? (
            <FormControl>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !formHookField.value && "text-muted-foreground"
                    )}
                    disabled={submitting}
                  >
                    {typeof formHookField.value === 'string' && formHookField.value ? (
                      format(new Date(formHookField.value), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={typeof formHookField.value === 'string' && formHookField.value ? new Date(formHookField.value) : undefined}
                    onSelect={(date: Date | undefined) => formHookField.onChange(date ? date.toISOString() : '')}
                    initialFocus
                    // Apply date constraints
                    fromDate={field.date_allow_past ? undefined : new Date()}
                    toDate={field.date_allow_future ? undefined : new Date()}
                    disabled={(date: Date) => {
                      const minDate = field.date_min ? new Date(field.date_min) : null;
                      const maxDate = field.date_max ? new Date(field.date_max) : null;
                      if (minDate && date < minDate) return true;
                      if (maxDate && date > maxDate) return true;
                      return false;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </FormControl>
          ) : field.field_type === 'phone' ? (
            <FormControl>
              <Input
                id={field.id}
                type="tel"
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined}
              />
            </FormControl>
          ) : field.field_type === 'number' ? (
            <FormControl>
              <Input
                id={field.id}
                type="number"
                {...formHookField}
                // Ensure value is always string or undefined for number input
                value={formHookField.value === undefined || formHookField.value === null ? '' : formHookField.value}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined}
              />
            </FormControl>
          ) : field.field_type === 'richtext' ? (
            <FormControl>
              <RichTextEditor
                value={String(formHookField.value || '')}
                onChange={formHookField.onChange}
                readOnly={submitting}
                className="min-h-[120px]"
              />
            </FormControl>
          ) : field.field_type === 'rating' ? (
            <FormControl>
              <div className="grid gap-2">
                <Slider
                  id={field.id}
                  min={field.rating_min_value ?? 1}
                  max={field.rating_max_value ?? 5}
                  step={1}
                  value={[Number(formHookField.value) || (field.rating_min_value ?? 1)]}
                  onValueChange={(val: number[]) => formHookField.onChange(val[0])}
                  disabled={submitting}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{field.rating_min_label || field.rating_min_value}</span>
                  <span>{field.rating_max_label || field.rating_max_value}</span>
                </div>
                <Input
                  type="hidden"
                  {...formHookField}
                  value={Number(formHookField.value) || (field.rating_min_value ?? 1)}
                />
              </div>
            </FormControl>
          ) : (
            <FormControl>
              <Input
                id={field.id}
                {...formHookField}
                value={String(formHookField.value || '')}
                required={field.is_required}
                disabled={submitting}
                placeholder={field.placeholder || undefined}
              />
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormFieldRenderer;