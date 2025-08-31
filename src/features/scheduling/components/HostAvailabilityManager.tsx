"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Trash2, CalendarIcon, Clock, CheckCircle, XCircle } from "lucide-react";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, setHours, setMinutes, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HostAvailability } from "../services/scheduling-service";
import { getHostAvailabilitiesAction, createHostAvailabilityAction, updateHostAvailabilityAction, deleteHostAvailabilityAction } from "../actions";

const availabilityFormSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time format (HH:MM)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time format (HH:MM)."),
  isAvailable: z.boolean(), // Explicitly boolean
}).refine((data) => {
  const startDateTime = setMinutes(setHours(data.date, parseInt(data.startTime.split(':')[0])), parseInt(data.startTime.split(':')[1]));
  const endDateTime = setMinutes(setHours(data.date, parseInt(data.endTime.split(':')[0])), parseInt(data.endTime.split(':')[1]));
  return endDateTime > startDateTime;
}, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

interface HostAvailabilityManagerProps {
  canModify: boolean; // Indicates if the current user can modify availabilities
}

export function HostAvailabilityManager({ canModify }: HostAvailabilityManagerProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [availabilities, setAvailabilities] = useState<HostAvailability[]>([]);
  const [isLoadingAvailabilities, setIsLoadingAvailabilities] = useState(true);
  const [isAvailabilityFormOpen, setIsAvailabilityFormOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<HostAvailability | undefined>(undefined);

  const form = useForm<z.infer<typeof availabilityFormSchema>>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      date: new Date(),
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: true,
    },
  });

  const fetchAvailabilities = async () => {
    setIsLoadingAvailabilities(true);
    try {
      if (!user?.id) {
        toast.error("User not authenticated.");
        return;
      }
      const fetchedAvailabilities = await getHostAvailabilitiesAction(user.id);
      if (fetchedAvailabilities) {
        setAvailabilities(fetchedAvailabilities);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load availabilities.");
    } finally {
      setIsLoadingAvailabilities(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchAvailabilities();
    }
  }, [user, isSessionLoading]);

  useEffect(() => {
    if (isAvailabilityFormOpen && editingAvailability) {
      const startDate = parseISO(editingAvailability.start_time);
      const endDate = parseISO(editingAvailability.end_time);
      form.reset({
        date: startDate,
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        isAvailable: editingAvailability.is_available,
      });
    } else if (isAvailabilityFormOpen && !editingAvailability) {
      form.reset({
        date: new Date(),
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      });
    }
  }, [isAvailabilityFormOpen, editingAvailability, form]);

  const onSubmit = async (values: z.infer<typeof availabilityFormSchema>) => {
    if (!canModify) {
      toast.error("You do not have permission to modify availabilities.");
      return;
    }
    try {
      const startDateTime = setMinutes(setHours(values.date, parseInt(values.startTime.split(':')[0])), parseInt(values.startTime.split(':')[1]));
      const endDateTime = setMinutes(setHours(values.date, parseInt(values.endTime.split(':')[0])), parseInt(values.endTime.split(':')[1]));

      const formData = new FormData();
      formData.append("start_time", startDateTime.toISOString());
      formData.append("end_time", endDateTime.toISOString());
      formData.append("is_available", values.isAvailable ? "on" : "off");

      let result: HostAvailability | null;
      if (editingAvailability) {
        result = await updateHostAvailabilityAction(editingAvailability.id, formData);
      } else {
        result = await createHostAvailabilityAction(formData);
      }

      if (result) {
        toast.success(`Availability ${editingAvailability ? "updated" : "created"} successfully!`);
        fetchAvailabilities();
        setIsAvailabilityFormOpen(false);
        setEditingAvailability(undefined);
      }
    } catch (error: any) {
      console.error("Availability form submission error:", error);
      toast.error(error.message || "Failed to save availability.");
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    try {
      const success = await deleteHostAvailabilityAction(id);
      if (success) {
        toast.success("Availability deleted successfully!");
        fetchAvailabilities();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete availability.");
    }
  };

  if (isLoadingAvailabilities) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small font-bold text-foreground">My Availability</CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Manage your time slots for scheduling interviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {availabilities.length === 0 ? (
          <p className="text-body-medium text-muted-foreground text-center">No availability slots defined yet.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {availabilities.map((slot) => (
              <Card key={slot.id} className="rounded-lg border p-4 flex items-center justify-between">
                <div>
                  <p className="text-title-medium font-medium text-foreground">
                    {format(parseISO(slot.start_time), "PPP")}
                  </p>
                  <p className="text-body-medium text-muted-foreground">
                    {format(parseISO(slot.start_time), "p")} - {format(parseISO(slot.end_time), "p")}
                  </p>
                  <div className="flex items-center gap-2 text-body-small mt-1">
                    {slot.is_available ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" /> Available
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <XCircle className="h-4 w-4 mr-1" /> Unavailable
                      </span>
                    )}
                  </div>
                </div>
                {canModify && (
                  <div className="flex space-x-2">
                    <Button variant="outlined" size="icon" className="rounded-md" onClick={() => { setEditingAvailability(slot); setIsAvailabilityFormOpen(true); }}>
                      <PlusCircle className="h-4 w-4" /> {/* Reusing PlusCircle for edit */}
                      <span className="sr-only">Edit Availability</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="rounded-md">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Availability</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-headline-small">Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription className="text-body-medium text-muted-foreground">
                            Are you sure you want to delete this availability slot ({format(parseISO(slot.start_time), "PPP p")})?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAvailability(slot.id)}
                            className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {canModify && (
          <Button
            type="button"
            variant="outlined"
            onClick={() => { setEditingAvailability(undefined); setIsAvailabilityFormOpen(true); }}
            className="w-full rounded-md text-label-large mt-6"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Availability
          </Button>
        )}

        {/* Availability Form Dialog */}
        <Dialog open={isAvailabilityFormOpen} onOpenChange={setIsAvailabilityFormOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-xl shadow-lg bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-headline-small">
                {editingAvailability ? "Edit Availability" : "Add New Availability"}
              </DialogTitle>
              <DialogDescription className="text-body-medium text-muted-foreground">
                {editingAvailability ? "Update the details of this availability slot." : "Define a new time slot when you are available."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-label-large">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={!canModify}>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-label-large">Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="rounded-md" disabled={!canModify} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-label-large">End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="rounded-md" disabled={!canModify} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-label-large">Mark as Available</FormLabel>
                        <FormDescription className="text-body-small">
                          Toggle to mark this slot as available or unavailable.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground"
                          disabled={!canModify}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outlined" onClick={() => setIsAvailabilityFormOpen(false)} className="rounded-md text-label-large">
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting || !canModify}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingAvailability
                      ? "Save Changes"
                      : "Add Availability"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}