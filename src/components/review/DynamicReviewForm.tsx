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
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DynamicReviewFormProps {
  criteria: EvaluationCriterion[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
  isSubmitting: boolean;
}

export const DynamicReviewForm = ({ criteria, onSubmit, isSubmitting }: DynamicReviewFormProps) => {
  const formSchema = z.object({
    ...criteria.reduce((acc, criterion) => {
      let schema: z.ZodTypeAny;
      switch (criterion.criterion_type) {
        case 'number_scale':
          schema = z.number().min(criterion.min_score || 0).max(criterion.max_score || 10);
          break;
        case 'pass_fail':
        case 'select':
          schema = z.string().min(1, "Please select an option.");
          break;
        default:
          schema = z.string().optional();
      }
      acc[criterion.id] = schema;
      return acc;
    }, {} as Record<string, z.ZodTypeAny>),
    overall_score: z.number().min(1).max(10),
    internal_notes: z.string().optional(),
    shared_feedback: z.string().optional(),
  });

  type ReviewFormValues = z.infer<typeof formSchema>;

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...criteria.reduce((acc, criterion) => {
        if (criterion.criterion_type === 'number_scale') {
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
            {criteria.map(criterion => (
              <FormField
                key={criterion.id}
                control={form.control}
                name={criterion.id as keyof ReviewFormValues}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{criterion.label}</FormLabel>
                    <FormControl>
                      <>
                        {criterion.criterion_type === 'number_scale' && (
                          <div className="grid gap-2">
                            <Slider
                              min={criterion.min_score || 1}
                              max={criterion.max_score || 5}
                              step={1}
                              value={[field.value as number]}
                              onValueChange={(val) => field.onChange(val[0])}
                              disabled={isSubmitting}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>{criterion.min_score || 1}</span>
                              <span>{field.value as number}</span>
                              <span>{criterion.max_score || 5}</span>
                            </div>
                          </div>
                        )}
                        {criterion.criterion_type === 'pass_fail' && (
                          <RadioGroup onValueChange={field.onChange} defaultValue={String(field.value || '')} className="flex gap-4">
                            <FormItem className="flex items-center space-x-2">
                              <FormControl><RadioGroupItem value="Pass" /></FormControl>
                              <Label>Pass</Label>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2">
                              <FormControl><RadioGroupItem value="Fail" /></FormControl>
                              <Label>Fail</Label>
                            </FormItem>
                          </RadioGroup>
                        )}
                        {criterion.criterion_type === 'select' && (
                          <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              {criterion.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        {criterion.criterion_type === 'text' && (
                          <Textarea {...field} placeholder="Your evaluation..." disabled={isSubmitting} />
                        )}
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <hr />
            <FormField
              control={form.control}
              name="overall_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Score: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1} max={10} step={1}
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="internal_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes</FormLabel>
                  <FormDescription>These notes are only visible to your team.</FormDescription>
                  <FormControl>
                    <Textarea placeholder="Provide your private feedback..." {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shared_feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shared Feedback (Optional)</FormLabel>
                  <FormDescription>This feedback may be shared with the applicant at a later stage.</FormDescription>
                  <FormControl>
                    <Textarea placeholder="Provide feedback for the applicant..." {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};