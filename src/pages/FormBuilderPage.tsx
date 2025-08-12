import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { FormField, FormSection, DisplayRule } from "@/types"; // Import DisplayRule
import { showError, showSuccess } from "@/utils/toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormFieldItem } from "@/components/FormFieldItem";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ConditionalLogicBuilder from "@/components/ConditionalLogicBuilder";
import EditFormFieldDialog from "@/components/EditFormFieldDialog"; // Import the new component

const FormBuilderPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [programTitle, setProgramTitle] = useState('');
  const [sections, setSections] = useState<FormSection[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormField['field_type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldSectionId, setNewFieldSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for ConditionalLogicBuilder
  const [isLogicBuilderOpen, setIsLogicBuilderOpen] = useState(false);
  const [fieldToEditLogic, setFieldToEditLogic] = useState<FormField | null>(null);

  // State for EditFormFieldDialog
  const [isEditFieldDialogOpen, setIsEditFieldDialogOpen] = useState(false);
  const [fieldToEditDetails, setFieldToEditDetails] = useState<FormField | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!programId) return;
      setLoading(true);

      const { data: programData, error: programError } = await supabase
        .from('programs').select('title').eq('id', programId).single();
      
      if (programError) {
        showError("Could not fetch program details.");
        setLoading(false);
        return;
      }
      setProgramTitle(programData.title);

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('form_sections').select('*').eq('program_id', programId).order('order', { ascending: true });
      
      if (sectionsError) {
        showError("Could not fetch form sections.");
      } else {
        setSections(sectionsData || []);
        // Set default section for new fields if sections exist
        if (sectionsData && sectionsData.length > 0) {
          setNewFieldSectionId(sectionsData[0].id);
        }
      }

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields').select('*').eq('program_id', programId).order('order', { ascending: true });

      if (fieldsError) {
        showError("Could not fetch form fields.");
      } else {
        setFields(fieldsData as FormField[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [programId]);

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
      // Automatically select the new section for new fields
      setNewFieldSectionId(data.id);
    }
    setIsSubmitting(false);
  };

  const handleDeleteSection = async (sectionId: string) => {
    const { error } = await supabase.from('form_sections').delete().eq('id', sectionId);
    if (error) {
      showError(`Failed to delete section: ${error.message}`);
    } else {
      setSections(sections.filter(s => s.id !== sectionId));
      // Also remove fields associated with this section
      setFields(fields.filter(f => f.section_id !== sectionId));
      showSuccess("Section deleted successfully.");
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !programId) return;

    setIsSubmitting(true);
    const nextOrder = fields.length > 0 ? Math.max(...fields.map(f => f.order)) + 1 : 1;

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
      // Optionally revert local state if save fails
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
      // Optionally revert local state if save fails
    } else {
      showSuccess("Field updated successfully!");
    }
    setIsEditFieldDialogOpen(false);
    setFieldToEditDetails(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      const newFields = arrayMove(fields, oldIndex, newIndex);
      setFields(newFields);

      const updates = newFields.map((field, index) => 
        supabase.from('form_fields').update({ order: index + 1 }).eq('id', field.id)
      );
      
      const results = await Promise.all(updates);
      if (results.some(res => res.error)) {
        showError("Failed to save new order. Please refresh.");
      }
    }
  };

  const getFieldsForSection = (sectionId: string | null) => {
    return fields.filter(field => field.section_id === sectionId);
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
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Form Sections</h3>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : sections.length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {sections.map(section => (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger className="flex justify-between items-center w-full pr-4">
                      <span className="font-semibold">{section.name}</span>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AccordionTrigger>
                    <AccordionContent>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={getFieldsForSection(section.id).map(f => f.id)} strategy={verticalListSortingStrategy}>
                          <ul className="space-y-2 p-2">
                            {getFieldsForSection(section.id).length > 0 ? (
                              getFieldsForSection(section.id).map(field => (
                                <FormFieldItem
                                  key={field.id}
                                  field={field}
                                  onDelete={handleDeleteField}
                                  onToggleRequired={handleToggleRequired}
                                  onEditLogic={handleEditLogic}
                                  onEdit={handleEditField} // Pass the new prop
                                />
                              ))
                            ) : (
                              <p className="text-muted-foreground text-sm text-center py-4">No fields in this section yet.</p>
                            )}
                          </ul>
                        </SortableContext>
                      </DndContext>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground text-sm">No sections defined yet. Add one to get started.</p>
            )}

            {uncategorizedFields.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Uncategorized Fields</h3>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={uncategorizedFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2">
                      {uncategorizedFields.map(field => (
                        <FormFieldItem
                          key={field.id}
                          field={field}
                          onDelete={handleDeleteField}
                          onToggleRequired={handleToggleRequired}
                          onEditLogic={handleEditLogic}
                          onEdit={handleEditField} // Pass the new prop
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>

          <form onSubmit={handleAddSection} className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-medium">Add New Section</h3>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="e.g., 'Personal Information'"
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                disabled={isSubmitting}
              />
              <Button type="submit" disabled={isSubmitting || !newSectionName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>
          </form>

          <form onSubmit={handleAddField} className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-medium">Add New Field</h3>
            <div className="grid gap-2 mt-4">
              <Input
                placeholder="e.g., 'Your Personal Statement'"
                value={newFieldLabel}
                onChange={e => setNewFieldLabel(e.target.value)}
                disabled={isSubmitting}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={newFieldType} onValueChange={(value) => setNewFieldType(value as FormField['field_type'])}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="radio">Radio Group</SelectItem>
                    <SelectItem value="checkbox">Checkboxes</SelectItem>
                    <SelectItem value="email">Email Address</SelectItem>
                    <SelectItem value="date">Date Picker</SelectItem>
                    <SelectItem value="phone">Phone Number</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="richtext">Rich Text</SelectItem>
                  </SelectContent>
                </Select>
                {(newFieldType === 'select' || newFieldType === 'radio' || newFieldType === 'checkbox') && (
                  <Input
                    placeholder="Comma-separated options, e.g., Yes, No"
                    value={newFieldOptions}
                    onChange={e => setNewFieldOptions(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-grow"
                  />
                )}
              </div>
              <Select
                value={newFieldSectionId || 'none'} // Use 'none' for null
                onValueChange={(value) => setNewFieldSectionId(value === 'none' ? null : value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Assign to Section (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem> {/* Changed value to 'none' */}
                  {sections.map(section => (
                    <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isSubmitting || !newFieldLabel.trim()} className="w-full sm:w-auto self-end">
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </div>
          </form>
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