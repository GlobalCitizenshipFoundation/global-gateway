"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { clonePathwayTemplateAction } from "../actions";

const cloneFormSchema = z.object({
  newName: z.string().min(1, { message: "New template name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
});

interface CloneTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  originalTemplateName: string;
}

export function CloneTemplateDialog({
  isOpen,
  onClose,
  templateId,
  originalTemplateName,
}: CloneTemplateDialogProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof cloneFormSchema>>({
    resolver: zodResolver(cloneFormSchema),
    defaultValues: {
      newName: `${originalTemplateName} (Copy)`,
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        newName: `${originalTemplateName} (Copy)`,
      });
    }
  }, [isOpen, originalTemplateName, form]);

  const onSubmit = async (values: z.infer<typeof cloneFormSchema>) => {
    try {
      const clonedTemplate = await clonePathwayTemplateAction(templateId, values.newName);
      if (clonedTemplate) {
        toast.success(`Template "${clonedTemplate.name}" cloned successfully!`);
        onClose();
        router.push(`/workbench/pathway-templates/${clonedTemplate.id}`);
      }
    } catch (error: any) {
      console.error("Clone template error:", error);
      toast.error(error.message || "Failed to clone pathway template.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-xl shadow-lg bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-headline-small">Clone Pathway Template</DialogTitle>
          <DialogDescription className="text-body-medium text-muted-foreground">
            Enter a new name for the cloned template. All phases will be copied.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="newName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">New Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., My New Fellowship Template" {...field} className="rounded-md" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="rounded-md text-label-large">
                Cancel
              </Button>
              <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Cloning..." : "Clone Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}