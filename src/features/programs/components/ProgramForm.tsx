"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Program } from "@/features/campaigns/services/campaign-service"; // Reusing Program interface
import { createProgramAction, updateProgramAction } from "../actions";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, { message: "Program name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
  start_date: z.date().nullable(),
  end_date: z.date().nullable(),
  status: z.enum(['draft', 'active', 'archived', 'completed'], { message: "Invalid program status." }),
}).refine((data) => {
  if (data.start_date && data.end_date && data.start_date > data.end_date) {
    return false;
  }
  return true;
}, {
  message: "End date cannot be before start date.",
  path: ["end_date"],
});

interface ProgramFormProps {
  initialData?: Program;
}

export function ProgramForm({ initialData }: ProgramFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      start_date: initialData?.start_date ? new Date(initialData.start_date) : null,
      end_date: initialData?.end_date ? new Date(initialData.end_date) : null,
      status: initialData?.status || "draft",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");
      formData.append("start_date", values.start_date ? values.start_date.toISOString() : "");
      formData.append("end_date", values.end_date ? values.end_date.toISOString() : "");
      formData.append("status", values.status);

      let result: Program | null;
      if (initialData) {
        result = await updateProgramAction(initialData.id, formData);
        if (result) {
          toast.success("Program updated successfully!");
          router.push(`/programs`); // Corrected path
        }
      } else {
        result = await createProgramAction(formData);
        if (result) {
          toast.success("Program created successfully!");
          router.push(`/programs`); // Corrected path
        }
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to save program.");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-headline-medium text-primary">
          {initialData ? "Edit Program" : "Create New Program"}
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          {initialData
            ? "Update the details of your program."
            : "Define a new program to group related campaigns and initiatives."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Program Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Global Leadership Initiative" {...field} className="rounded-md" />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    A unique and descriptive name for your program.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a brief overview of this program."
                      className="resize-y min-h-[80px] rounded-md"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    Optional: A detailed description of the program.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-label-large">Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outlined"
                            className={cn(
                              "w-full pl-3 text-left font-normal rounded-md",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl shadow-lg bg-card text-card-foreground border-border" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-body-small">
                      The date when the program officially begins.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-label-large">End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outlined"
                            className={cn(
                              "w-full pl-3 text-left font-normal rounded-md",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl shadow-lg bg-card text-card-foreground border-border" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-body-small">
                      The date when the program officially ends.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Program Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-md">
                        <SelectValue placeholder="Select program status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                      <SelectItem value="draft" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Draft</SelectItem>
                      <SelectItem value="active" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Active</SelectItem>
                      <SelectItem value="archived" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Archived</SelectItem>
                      <SelectItem value="completed" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-body-small">
                    The current operational status of the program.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? "Saving..."
                : initialData
                ? "Update Program"
                : "Create Program"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}