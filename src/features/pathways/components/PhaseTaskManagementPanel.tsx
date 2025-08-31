"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PlusCircle, Trash2, GripVertical, CalendarIcon, UserCircle2, CheckCircle, Clock } from "lucide-react";
import { PhaseTask } from "../services/phase-task-service";
import { getPhaseTasksAction, createPhaseTaskAction, updatePhaseTaskAction, deletePhaseTaskAction } from "../actions";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Added Dialog imports

const taskFormSchema = z.object({
  name: z.string().min(1, "Task name is required.").max(100, "Name cannot exceed 100 characters."),
  description: z.string().max(500, "Description cannot exceed 500 characters.").nullable().optional(),
  assigned_to_role: z.string().nullable().optional(),
  assigned_to_user_id: z.string().uuid("Invalid user ID.").nullable().optional(),
  due_date: z.date().nullable().optional(),
  status: z.enum(['pending', 'completed']).optional(),
});

interface PhaseTaskManagementPanelProps {
  phaseId: string;
  pathwayTemplateId: string; // Needed for authorization in actions
  canModify: boolean; // Can modify task definitions (add/edit/delete)
}

export function PhaseTaskManagementPanel({ phaseId, pathwayTemplateId, canModify }: PhaseTaskManagementPanelProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [tasks, setTasks] = useState<PhaseTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(true); // Changed to true for testing
  const [editingTask, setEditingTask] = useState<PhaseTask | undefined>(undefined);

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      description: "",
      assigned_to_role: null,
      assigned_to_user_id: null,
      due_date: null,
      status: "pending",
    },
  });

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const fetchedTasks = await getPhaseTasksAction(phaseId);
      if (fetchedTasks) {
        setTasks(fetchedTasks);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load tasks.");
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchTasks();
    }
  }, [user, isSessionLoading, phaseId]);

  useEffect(() => {
    if (isTaskFormOpen && editingTask) {
      const startDate = editingTask.due_date ? new Date(editingTask.due_date) : null;
      form.reset({
        name: editingTask.name,
        description: editingTask.description,
        assigned_to_role: editingTask.assigned_to_role,
        assigned_to_user_id: editingTask.assigned_to_user_id,
        due_date: startDate,
        status: editingTask.status,
      });
    } else if (isTaskFormOpen && !editingTask) {
      form.reset({
        name: "",
        description: "",
        assigned_to_role: null,
        assigned_to_user_id: null,
        due_date: null,
        status: "pending",
      });
    }
  }, [isTaskFormOpen, editingTask, form]);

  const onSubmit = async (values: z.infer<typeof taskFormSchema>) => {
    // Determine permissions for the current submission
    const isAssignedToCurrentUserForEditingTask = user?.id === editingTask?.assigned_to_user_id;
    const canUpdateStatusForEditingTask = canModify || isAssignedToCurrentUserForEditingTask;
    const canEditDetailsForEditingTask = canModify;

    if (!editingTask && !canModify) { // Trying to add a new task without permission
      toast.error("You do not have permission to add tasks.");
      return;
    }

    if (editingTask) {
      // If editing an existing task, check if user has permission for the specific changes
      const hasDetailChanges = values.name !== editingTask.name ||
                               values.description !== editingTask.description ||
                               values.assigned_to_role !== editingTask.assigned_to_role ||
                               values.assigned_to_user_id !== editingTask.assigned_to_user_id ||
                               (values.due_date?.toISOString() || null) !== (editingTask.due_date || null);
      const hasStatusChange = values.status !== editingTask.status;

      if (hasDetailChanges && !canEditDetailsForEditingTask) {
        toast.error("You do not have permission to modify task details.");
        return;
      }
      if (hasStatusChange && !canUpdateStatusForEditingTask) {
        toast.error("You do not have permission to update task status.");
        return;
      }
      if (!hasDetailChanges && !hasStatusChange) {
        toast.info("No changes detected.");
        setIsTaskFormOpen(false);
        setEditingTask(undefined);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description || "");
      formData.append("assigned_to_role", values.assigned_to_role || "");
      formData.append("assigned_to_user_id", values.assigned_to_user_id || "");
      formData.append("due_date", values.due_date ? values.due_date.toISOString() : "");
      formData.append("status", values.status || "pending");

      let result: PhaseTask | null;
      if (editingTask) {
        result = await updatePhaseTaskAction(editingTask.id, phaseId, pathwayTemplateId, formData); // Corrected arguments
      } else {
        formData.append("order_index", tasks.length.toString());
        result = await createPhaseTaskAction(phaseId, pathwayTemplateId, formData); // Corrected arguments
      }

      if (result) {
        toast.success(`Task ${editingTask ? "updated" : "created"} successfully!`);
        fetchTasks();
        setIsTaskFormOpen(false);
        setEditingTask(undefined);
      }
    } catch (error: any) {
      console.error("Task form submission error:", error);
      toast.error(error.message || "Failed to save task.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const success = await deletePhaseTaskAction(taskId, phaseId, pathwayTemplateId); // Corrected arguments
      if (success) {
        toast.success("Task deleted successfully!");
        fetchTasks();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task.");
    }
  };

  const handleToggleTaskStatus = async (task: PhaseTask) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      const formData = new FormData();
      formData.append("status", newStatus);
      const result = await updatePhaseTaskAction(task.id, phaseId, pathwayTemplateId, formData); // Corrected arguments
      if (result) {
        toast.success(`Task marked as ${newStatus}.`);
        fetchTasks();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update task status.");
    }
  };

  const getUserInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const assignedRoleOptions = [
    { value: "applicant", label: "Applicant" },
    { value: "reviewer", label: "Reviewer" },
    { value: "coordinator", label: "Coordinator" },
    { value: "admin", label: "Administrator" },
    { value: "screener", label: "Screener" },
    { value: "evaluator", label: "Evaluator" },
  ];

  // Placeholder for fetching actual users for assignment. In a real app, this would be a search/select component.
  const availableUsers = [
    { id: user?.id || "current_user_id", name: user?.user_metadata?.first_name || "Current User" },
    { id: "user_1", name: "Alice Smith" },
    { id: "user_2", name: "Bob Johnson" },
  ];

  // Determine permissions for the dialog's current editing task
  const isAssignedToCurrentUserForEditingTask = user?.id === editingTask?.assigned_to_user_id;
  const canUpdateStatusForEditingTask = canModify || isAssignedToCurrentUserForEditingTask;
  const canEditDetailsForEditingTask = canModify;

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-headline-small text-foreground">Phase Tasks</CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Define and manage sub-tasks for this phase.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoadingTasks ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <p className="text-body-medium text-muted-foreground text-center">No tasks defined for this phase yet.</p>
            ) : (
              tasks.map((task) => {
                const isAssignedToCurrentUser = user?.id === task.assigned_to_user_id;
                const canUpdateStatus = canModify || isAssignedToCurrentUser; // Creator/Admin or assigned user can update status
                const canEditDetails = canModify; // Only creator/admin can edit details

                return (
                  <Card key={task.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={task.status === 'completed'}
                          onCheckedChange={() => canUpdateStatus && handleToggleTaskStatus(task)}
                          disabled={!canUpdateStatus}
                          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <h4 className={cn("text-title-medium font-medium text-foreground", task.status === 'completed' && "line-through text-muted-foreground")}>
                          {task.name}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        {canEditDetails && (
                          <Button variant="outlined" size="icon" className="rounded-md" onClick={() => { setEditingTask(task); setIsTaskFormOpen(true); }}>
                            <PlusCircle className="h-4 w-4" /> {/* Reusing PlusCircle for edit, could be Edit icon */}
                            <span className="sr-only">Edit Task</span>
                          </Button>
                        )}
                        {canEditDetails && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon" className="rounded-md">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Task</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-headline-small">Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription className="text-body-medium text-muted-foreground">
                                  Are you sure you want to delete the task &quot;{task.name}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-body-small text-muted-foreground ml-7">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-body-small text-muted-foreground ml-7">
                      {task.assigned_to_user_id && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={task.profiles?.avatar_url || ""} alt={task.profiles?.first_name || "User"} />
                            <AvatarFallback className="bg-primary-container text-on-primary-container text-label-small">
                              {getUserInitials(task.profiles?.first_name, task.profiles?.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>Assigned to: {task.profiles?.first_name || "Unknown User"}</span>
                        </div>
                      )}
                      {task.assigned_to_role && !task.assigned_to_user_id && (
                        <div className="flex items-center gap-1">
                          <UserCircle2 className="h-4 w-4" />
                          <span>Assigned to: {task.assigned_to_role}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {task.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-yellow-600" />}
                        <span className="capitalize">{task.status}</span>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {canModify && (
          <Button
            type="button"
            variant="outlined"
            onClick={() => { setEditingTask(undefined); setIsTaskFormOpen(true); }}
            className="w-full rounded-md text-label-large mt-6"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Task
          </Button>
        )}

        {/* Task Form Dialog */}
        <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-xl shadow-lg bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-headline-small">
                {editingTask ? "Edit Task" : "Add New Task"}
              </DialogTitle>
              <DialogDescription className="text-body-medium text-muted-foreground">
                {editingTask ? "Update the details of this task." : "Define a new task for this phase."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Task Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Review application documents" {...field} className="rounded-md" disabled={!canEditDetailsForEditingTask && !!editingTask} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide details about this task."
                          className="resize-y min-h-[80px] rounded-md"
                          {...field}
                          value={field.value || ""}
                          disabled={!canEditDetailsForEditingTask && !!editingTask}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_to_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Assigned to Role (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={!canEditDetailsForEditingTask && !!editingTask}>
                        <FormControl>
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                          <SelectItem value="" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                            None
                          </SelectItem>
                          {assignedRoleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-body-small">
                        Assign this task to a specific role (e.g., 'applicant', 'reviewer').
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_to_user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Assigned to Specific User (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} disabled={!canEditDetailsForEditingTask && !!editingTask}>
                        <FormControl>
                          <SelectTrigger className="rounded-md">
                            <SelectValue placeholder="Select a user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                          <SelectItem value="" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                            None
                          </SelectItem>
                          {availableUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-body-small">
                        Assign this task to a specific user. Overrides role assignment.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-label-large">Due Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild disabled={!canEditDetailsForEditingTask && !!editingTask}>
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
                {editingTask && ( // Only show status for existing tasks
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-label-large">Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!canUpdateStatusForEditingTask}>
                          <FormControl>
                            <SelectTrigger className="rounded-md">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                            <SelectItem value="pending" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Pending</SelectItem>
                            <SelectItem value="completed" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <DialogFooter>
                  <Button type="button" variant="outlined" onClick={() => setIsTaskFormOpen(false)} className="rounded-md text-label-large">
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting || (!editingTask && !canModify) || (editingTask && !canEditDetailsForEditingTask && !canUpdateStatusForEditingTask)}>
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : editingTask
                      ? "Save Changes"
                      : "Add Task"}
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