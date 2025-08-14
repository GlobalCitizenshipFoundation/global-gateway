import { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField as FormFieldComponent,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EvaluationCriterion } from "@/types";
import { Info, X } from "lucide-react";
import { Switch } from '../ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CriterionOptionsInput } from './CriterionOptionsInput';

const criterionSchema = z.object({
  label: z.string().min(1, "Label is required."),
  criterion_type: z.enum(['numerical_score', 'number_scale', 'single_select', 'short_text', 'long_text', 'repeater_buttons']),
  is_public: z.boolean(),
  options: z.array(z.object({
    label: z.string().min(1, "Label cannot be empty."),
    value: z.string().optional(),
  })).optional(),
  min_score: z.preprocess((val) => val === '' ? null : Number(val), z.number().nullable().optional()),
  max_score: z.preprocess((val) => val === '' ? null : Number(val), z.number().nullable().optional()),
  min_label: z.string().optional().nullable(),
  max_label: z.string().optional().nullable(),
  weight: z.preprocess((val) => Number(val), z.number().min(0, "Weight must be non-negative.")),
});

type CriterionFormValues = z.infer<typeof criterionSchema>;

interface CriterionPropertiesPanelProps {
  criterion: EvaluationCriterion;
  onSave: (criterionId: string, values: Partial<EvaluationCriterion>) => void;
  onClose: () => void;
}

export const CriterionPropertiesPanel = ({ criterion, onSave, onClose }: CriterionPropertiesPanelProps) => {
  const form = useForm<CriterionFormValues>({
    resolver: zodResolver(criterionSchema),
    defaultValues: {},
  });

  useEffect(() => {
    if (criterion) {
      form.reset({
        label: criterion.label,
        criterion_type: criterion.criterion_type,
        is_public: criterion.is_public,
        options: Array.isArray(criterion.options) ? criterion.options.map(o => ({ label: o.label, value: String(o.value || '') })) : [],
        min_score: criterion.min_score,
        max_score: criterion.max_score,
        min_label: criterion.min_label,
        max_label: criterion.max_label,
        weight: criterion.weight,
      });
    }
  }, [criterion, form]);

  const onSubmit = (values: CriterionFormValues) => {
    const updates: Partial<EvaluationCriterion> = {
      ...values,
      options: ['single_select', 'repeater_buttons'].includes(values.criterion_type) ? values.options?.map(o => ({ ...o, value: o.value || o.label })) : null,
      min_score: ['numerical_score', 'number_scale'].includes(values.criterion_type) ? values.min_score : null,
      max_score: ['numerical_score', 'number_scale'].includes(values.criterion_type) ? values.max_score : null,
      min_label: values.criterion_type === 'number_scale' ? values.min_label : null,
      max_label: values.criterion_type === 'number_scale' ? values.max_label : null,
    };
    onSave(criterion.id, updates);
  };

  const selectedType = form.watch('criterion_type');
  const isPublic = form.watch('is_public');

  return (
    <div className="p-6 h-full overflow-y-auto bg-background border-l">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Edit Criterion</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormFieldComponent control={form.control} name="label" render={({ field }) => (<FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormFieldComponent control={form.control} name="criterion_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Criterion Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="numerical_score">Numerical Score</SelectItem>
                  <SelectItem value="number_scale">Number Scale</SelectItem>
                  <SelectItem value="single_select">Single Select</SelectItem>
                  <SelectItem value="repeater_buttons">Repeater Buttons</SelectItem>
                  <SelectItem value="short_text">Short Text</SelectItem>
                  <SelectItem value="long_text">Long Text</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {['numerical_score', 'number_scale'].includes(selectedType) && (
            <div className="grid grid-cols-2 gap-4">
              <FormFieldComponent control={form.control} name="min_score" render={({ field }) => (<FormItem><FormLabel>Min Score</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormFieldComponent control={form.control} name="max_score" render={({ field }) => (<FormItem><FormLabel>Max Score</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
          )}
          {selectedType === 'number_scale' && (
            <div className="grid grid-cols-2 gap-4">
              <FormFieldComponent control={form.control} name="min_label" render={({ field }) => (<FormItem><FormLabel>Min Label</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormFieldComponent control={form.control} name="max_label" render={({ field }) => (<FormItem><FormLabel>Max Label</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
            </div>
          )}
          {['single_select', 'repeater_buttons'].includes(selectedType) && (
            <FormFieldComponent control={form.control} name="options" render={() => (
              <FormItem>
                <FormLabel>Options</FormLabel>
                <FormControl><CriterionOptionsInput /></FormControl>
                <FormDescription>Define the selectable options. The value is optional and will default to the label if left blank.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          )}

          <FormFieldComponent control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Weight</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormDescription>Determines the importance of this criterion in the total score.</FormDescription><FormMessage /></FormItem>)} />
          <FormFieldComponent control={form.control} name="is_public" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5"><FormLabel className="text-base">Visibility</FormLabel><FormDescription>Set whether this criterion is internal or public.</FormDescription></div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          {isPublic && (<Alert><Info className="h-4 w-4" /><AlertTitle>Public Criterion</AlertTitle><AlertDescription>Aggregated and anonymized feedback for this criterion may be shared with applicants in the future.</AlertDescription></Alert>)}
          <Button type="submit" className="w-full">Save Criterion</Button>
        </form>
      </Form>
    </div>
  );
};