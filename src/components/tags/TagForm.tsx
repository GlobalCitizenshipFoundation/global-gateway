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
    import { Tag } from "@/types";
    import { TagColorPicker } from "./TagColorPicker";
    import { TagApplicabilitySelector } from "./TagApplicabilitySelector";
    import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
    import { AlertTriangle } from "lucide-react";

    const tagFormSchema = z.object({
      name: z.string().min(1, { message: "Tag name is required." }),
      color: z.string().min(1, { message: "Tag color is required." }),
      applicable_to: z.array(z.string()).min(1, { message: "At least one applicable module must be selected." }),
    });

    type TagFormValues = z.infer<typeof tagFormSchema>;

    interface TagFormProps {
      initialData?: Tag;
      onSubmit: (values: TagFormValues) => Promise<void>;
      isSubmitting: boolean;
      isNewTag: boolean;
    }

    export const TagForm = ({ initialData, onSubmit, isSubmitting, isNewTag }: TagFormProps) => {
      const form = useForm<TagFormValues>({
        resolver: zodResolver(tagFormSchema),
        defaultValues: {
          name: initialData?.name || "",
          color: initialData?.color || "default", // Default to 'default' gray
          applicable_to: initialData?.applicable_to || [],
        },
      });

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!form.formState.isValid && form.formState.isSubmitted && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>
                  Please correct the errors in the form before saving.
                </AlertDescription>
              </Alert>
            )}
            <FormFieldComponent
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'Marketing', 'Urgent', 'Science'" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your tag.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormFieldComponent
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Color</FormLabel>
                  <FormControl>
                    <TagColorPicker value={field.value} onChange={field.onChange} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    Choose a color for this tag.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormFieldComponent
              control={form.control}
              name="applicable_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicable To</FormLabel>
                  <FormControl>
                    <TagApplicabilitySelector value={field.value} onChange={field.onChange} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    Select the modules where this tag can be used.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isNewTag ? "Creating Tag..." : "Saving Changes...") : (isNewTag ? "Create Tag" : "Save Changes")}
            </Button>
          </form>
        </Form>
      );
    };