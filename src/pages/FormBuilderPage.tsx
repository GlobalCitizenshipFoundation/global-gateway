import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { FormField } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FormFieldItem } from "@/components/FormFieldItem";

const FormBuilderPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [programTitle, setProgramTitle] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'email' | 'date' | 'phone' | 'number'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Application Fields</h3>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : fields.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-2">
                    {fields.map(field => (
                      <FormFieldItem
                        key={field.id}
                        field={field}
                        onDelete={handleDeleteField}
                        onToggleRequired={handleToggleRequired}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            ) : (
              <p className="text-muted-foreground text-sm">No fields defined yet. Add one to get started.</p>
            )}
          </div>
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
                <Select value={newFieldType} onValueChange={(value) => setNewFieldType(value as any)}>
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
              <Button type="submit" disabled={isSubmitting || !newFieldLabel.trim()} className="w-full sm:w-auto self-end">
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormBuilderPage;