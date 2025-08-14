import { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { FormField, FormSection, DisplayRule } from "@/types";
import ConditionalLogicBuilder from "@/components/forms/ConditionalLogicBuilder";
import { X } from "lucide-react";
import { BasicProperties } from './field-properties/BasicProperties';
import { DateProperties } from './field-properties/DateProperties';
import { RatingProperties } from './field-properties/RatingProperties';

const editFormFieldSchema = z.object({
  label: z.string().min(1, { message: "Label cannot be empty." }),
  field_type: z.enum(['text', 'textarea', 'select', 'radio', 'checkbox', 'email', 'date', 'phone', 'number', 'richtext', 'rating']),
  options: z.string().optional(),
  is_required: z.boolean(),
  description: z.string().nullable().optional(),
  tooltip: z.string().nullable().optional(),
  placeholder: z.string().nullable().optional(),
  section_id: z.string().nullable().optional(),
  date_min: z.string().nullable().optional(),
  date_max: z.string().nullable().optional(),
  date_allow_past: z.boolean().optional(),
  date_allow_future: z.boolean().optional(),
  rating_min_value: z.preprocess((val) => (val === '' ? null : Number(val)), z.number().nullable().optional()),
  rating_max_value: z.preprocess((val) => (val === '' ? null : Number(val)), z.number().nullable().optional()),
  rating_min_label: z.string().nullable().optional(),
  rating_max_label: z.string().nullable().optional(),
});

type EditFormFieldValues = z.infer<typeof editFormFieldSchema>;

interface FieldPropertiesPanelProps {
  field: FormField;
  sections: FormSection[];
  allFields: FormField[];
  onSave: (fieldId: string, values: EditFormFieldValues) => void;
  onSaveLogic: (fieldId: string, rules: DisplayRule[], logicType: 'AND' | 'OR') => void;
  onClose: () => void;
}

export const FieldPropertiesPanel = ({
  field,
  sections,
  allFields,
  onSave,
  onSaveLogic,
  onClose,
}: FieldPropertiesPanelProps) => {
  const form = useForm<EditFormFieldValues>({
    resolver: zodResolver(editFormFieldSchema),
    defaultValues: {
      label: "",
      field_type: "text",
      options: "",
      is_required: false,
      description: "",
      tooltip: "",
      placeholder: "",
      section_id: null,
      date_min: null,
      date_max: null,
      date_allow_past: true,
      date_allow_future: true,
      rating_min_value: 1,
      rating_max_value: 5,
      rating_min_label: "Poor",
      rating_max_label: "Excellent",
    },
  });

  useEffect(() => {
    if (field) {
      form.reset({
        label: field.label,
        field_type: field.field_type as EditFormFieldValues['field_type'],
        options: Array.isArray(field.options) ? field.options.join(', ') : '',
        is_required: field.is_required,
        description: field.description || '',
        tooltip: field.tooltip || '',
        placeholder: field.placeholder || '',
        section_id: field.section_id || null,
        date_min: field.date_min || null,
        date_max: field.date_max || null,
        date_allow_past: field.date_allow_past ?? true,
        date_allow_future: field.date_allow_future ?? true,
        rating_min_value: field.rating_min_value ?? 1,
        rating_max_value: field.rating_max_value ?? 5,
        rating_min_label: field.rating_min_label || "Poor",
        rating_max_label: field.rating_max_label || "Excellent",
      });
    }
  }, [field, form]);

  const onSubmit = (values: EditFormFieldValues) => {
    onSave(field.id, values);
  };

  const selectedFieldType = form.watch("field_type");

  return (
    <div className="p-6 h-full overflow-y-auto bg-background border-l">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit Field: "{field.label}"</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <BasicProperties form={form} sections={sections} selectedFieldType={selectedFieldType} />
          
          {selectedFieldType === 'date' && <DateProperties form={form} />}
          {selectedFieldType === 'rating' && <RatingProperties form={form} />}

          <Button type="submit" className="w-full mt-4">Save Field Properties</Button>
        </form>
      </Form>

      <Separator className="my-8" />

      <h3 className="text-lg font-semibold mb-4">Conditional Logic</h3>
      <ConditionalLogicBuilder
        fieldToEdit={field}
        allFields={allFields}
        onSave={onSaveLogic}
        isOpen={true}
        onClose={() => {}}
      />
    </div>
  );
};