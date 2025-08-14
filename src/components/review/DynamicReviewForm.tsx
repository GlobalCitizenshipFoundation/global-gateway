import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvaluationCriterion } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import DynamicIcon from "../common/DynamicIcon";
import React from "react"; // Explicit React import

interface DynamicReviewFormProps {
  criteria: EvaluationCriterion[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
  isSubmitting: boolean;
  isPreview?: boolean;
}

export const DynamicReviewForm = ({ criteria, onSubmit, isSubmitting, isPreview = false }: DynamicReviewFormProps) => {
  const formSchemaObject = criteria.reduce((acc: Record<string, z.ZodTypeAny>, criterion: EvaluationCriterion) => {
    let schema: z.ZodTypeAny;
    switch (criterion.criterion_type) {
      case 'numerical_score':
      case 'number_scale':
        schema = z.number().min(criterion.min_score || 0).max(criterion.max_score || 10);
        break;
      case 'single_select':
      case 'repeater_buttons':
      case 'status':
        schema = z.string().min(1, "Please select an option.");
        break;
      case 'short_text':
      case 'long_text':
        schema = z.string().optional();
        break;
      default:
        schema = z.any();
    }
    acc[criterion.id] = schema;
    return acc;
  }, {} as Record<string, z.ZodTypeAny>);

  if (!isPreview) {
    formSchemaObject.overall_score = z.number().min(1).max(10);
    formSchemaObject.internal_notes = z.string().optional();
    formSchemaObject.shared_feedback = z.string().optional();
  }

  const formSchema = z.object(formSchemaObject);

  type ReviewFormValues = z.infer<typeof formSchema>;

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...criteria.reduce((acc: Record<string, any>, criterion: EvaluationCriterion) => {
        if (criterion.criterion_type === 'number_scale' || criterion.criterion_type === 'numerical_score') {
          acc[criterion.id] = criterion.min_score || 1;
        }
        return acc;
      }, {} as Record<string, any>),
      overall_score: 5,
      internal_notes: "",
      shared_feedback: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Your Review</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {criteria.map((criterion: EvaluationCriterion) => (
              <FormField
                key={criterion.id}
                control={form.control}
                name={criterion.id as keyof ReviewFormValues}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>{criterion.label}</FormLabel>
                    </div>
                    {criterion.is_public && (
                      <FormDescription className="flex items-center gap-1 text-blue-600">
                        <Info className="h-4 w-4" />
                        Aggregated and anonymized feedback for this criterion may be shared with applicants.
                      </FormDescription>
                    )}
                    {criterion.description && <FormDescription dangerouslySetInnerHTML={{ __html: criterion.description }} />}
                    <FormControl>
                      <>
                        {criterion.criterion_type === 'numerical_score' && <Input type="number" min={criterion.min_score || undefined} max={criterion.max_score || undefined} {...field} onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} disabled={isSubmitting} />}
                        {criterion.criterion_type === 'number_scale' && (
                          <div className="grid gap-2 pt-2">
                            <Slider min={criterion.min_score || 1} max={criterion.max_score || 5} step={1} value={[field.value as number]} onValueChange={(val: number[]) => field.onChange(val[0])} disabled={isSubmitting} />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>{criterion.min_label || criterion.min_score}</span>
                              <span>{criterion.max_label || criterion.max_score}</span>
                            </div>
                            <div className="text-center font-semibold text-lg text-primary mt-1">{field.value as number}</div>
                          </div>
                        )}
                        {(criterion.criterion_type === 'repeater_buttons' || criterion.criterion_type === 'status') && (
                          <RadioGroup onValueChange={field.onChange} value={String(field.value || '')} className="flex flex-wrap gap-2">
                            {criterion.options?.map((opt: any) => (
                              <div key={opt.label}>
                                <RadioGroupItem value={String(opt.value || opt.label)} id={`${field.name}-${opt.label}`} className="sr-only" />
                                <Label htmlFor={`${field.name}-${opt.label}`} className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer px-4 py-2", field.value === (opt.value || opt.label) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground')}>
                                  {opt.icon && <DynamicIcon name={opt.icon} className="mr-2 h-4 w-4" />}
                                  {opt.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                        {criterion.criterion_type === 'single_select' && (
                          <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              {criterion.options?.map((opt: any) => <SelectItem key={opt.label} value={String(opt.value || opt.label)}>{opt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        {criterion.criterion_type === 'short_text' && <Input {...field} placeholder="Your evaluation..." disabled={isSubmitting} />}
                        {criterion.criterion_type === 'long_text' && <Textarea {...field} placeholder="Your evaluation..." disabled={isSubmitting} />}
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            {!isPreview && (
              <>
                <hr />
                <FormField control={form.control} name="overall_score" render={({ field }) => (<FormItem><FormLabel>Overall Score: {field.value}</FormLabel><FormControl><Slider min={1} max={10} step={1} value={[field.value as number]} onValueChange={(val: number[]) => field.onChange(val[0])} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="internal_notes" render={({ field }) => (<FormItem><FormLabel>Internal Notes</FormLabel><FormDescription>These notes are only visible to your team.</FormDescription><FormControl><Textarea placeholder="Provide your private feedback..." {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="shared_feedback" render={({ field }) => (<FormItem><FormLabel>Shared Feedback (Optional)</FormLabel><FormDescription>This feedback may be shared with the applicant at a later stage.</FormDescription><FormControl><Textarea placeholder="Provide feedback for the applicant..." {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Review"}</Button>
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};