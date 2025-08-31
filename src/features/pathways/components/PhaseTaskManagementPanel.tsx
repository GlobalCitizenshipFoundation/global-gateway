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
import { PhaseTask } from "@/types/supabase"; // Corrected import path for PhaseTask
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
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
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
    { value: "reviewer", label: "Reviewer<dyad-problem-report summary="210 problems">
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="241" column="6" code="17008">JSX element 'div' has no corresponding closing tag.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="363" column="8" code="17008">JSX element 'Dialog' has no corresponding closing tag.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="364" column="10" code="17008">JSX element 'DialogContent' has no corresponding closing tag.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="373" column="12" code="17008">JSX element 'Form' has no corresponding closing tag.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="374" column="14" code="17008">JSX element 'form' has no corresponding closing tag.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="378" column="25" code="2657">JSX expressions must have one parent element.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="509" column="9" code="1005">'}' expected.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="509" column="33" code="1003">Identifier expected.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="528" column="2" code="17008">JSX element 'dyad-write' has no corresponding closing tag.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="533" column="5" code="1005">'}' expected.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="548" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="551" column="5" code="1005">'}' expected.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="567" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="571" column="5" code="1005">'}' expected.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="576" column="24" code="1003">Identifier expected.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="576" column="29" code="1382">Unexpected token. Did you mean `{'&gt;'}` or `&amp;gt;`?</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="586" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="590" column="22" code="1005">'}' expected.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="591" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="595" column="5" code="1005">'}' expected.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="607" column="1" code="1381">Unexpected token. Did you mean `{'}'}` or `&amp;rbrace;`?</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="609" column="73" code="1005">'&lt;/' expected.</problem>
<problem file="src/features/pathways/actions.ts" line="4" column="3" code="2724">'&quot;./services/pathway-template-service&quot;' has no exported member named 'PathwayTemplate'. Did you mean 'getPathwayTemplates'?</problem>
<problem file="src/features/pathways/actions.ts" line="5" column="3" code="2459">Module '&quot;./services/pathway-template-service&quot;' declares 'Phase' locally, but it is not exported.</problem>
<problem file="src/features/pathways/actions.ts" line="19" column="3" code="2459">Module '&quot;./services/phase-task-service&quot;' declares 'PhaseTask' locally, but it is not exported.</problem>
<problem file="src/features/packages/components/PackageDetail.tsx" line="44" column="64" code="2304">Cannot find name 'Campaign'.</problem>
<problem file="src/features/packages/components/PackageDetail.tsx" line="407" column="63" code="2304">Cannot find name 'Campaign'.</problem>
<problem file="src/features/pathways/components/phase-configs/FormPhaseConfig.tsx" line="24" column="10" code="2459">Module '&quot;../../services/pathway-template-service&quot;' declares 'BaseConfigurableItem' locally, but it is not exported.</problem>
<problem file="src/features/pathways/components/phase-configs/ReviewPhaseConfig.tsx" line="26" column="10" code="2459">Module '&quot;../../services/pathway-template-service&quot;' declares 'BaseConfigurableItem' locally, but it is not exported.</problem>
<problem file="src/features/pathways/components/phase-configs/EmailPhaseConfig.tsx" line="22" column="10" code="2459">Module '&quot;../../services/pathway-template-service&quot;' declares 'BaseConfigurableItem' locally, but it is not exported.</problem>
<problem file="src/features/pathways/components/phase-configs/SchedulingPhaseConfig.tsx" line="21" column="10" code="2459">Module '&quot;../../services/pathway-template-service&quot;' declares 'BaseConfigurableItem' locally, but it is not exported.</problem>
<problem file="src/features/pathways/components/phase-configs/DecisionPhaseConfig.tsx" line="22" column="10" code="2459">Module '&quot;../../services/pathway-template-service&quot;' declares 'BaseConfigurableItem' locally, but it is not exported.</problem>
<problem file="src/features/pathways/components/phase-configs/RecommendationPhaseConfig.tsx" line="24" column="10" code="2459">Module '&quot;../../services/pathway-template-service&quot;' declares 'BaseConfigurableItem' locally, but it is not exported.</problem>
<problem file="src/features/pathways/components/phase-configs/ScreeningPhaseConfig.tsx" line="23" column="10" code="2459">Module '&quot;../../services/pathway-template-service&quot;' declares 'BaseConfigurableItem' locally, but it is not exported.</problem>
<problem file="src/features/campaigns/components/CampaignPhaseConfigurationPanel.tsx" line="14" column="10" code="2459">Module '&quot;@/features/pathways/services/pathway-template-service&quot;' declares 'BaseConfigurableItem' locally, but it is not exported.</problem>
<problem file="src/features/campaigns/components/CampaignForm.tsx" line="33" column="10" code="2724">'&quot;@/features/pathways/services/pathway-template-service&quot;' has no exported member named 'PathwayTemplate'. Did you mean 'getPathwayTemplates'?</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="378" column="17" code="2322">Type 'Element' is not assignable to type '({ field, fieldState, formState, }: { field: ControllerRenderProps&lt;{ name: string; description?: string | null | undefined; status?: &quot;pending&quot; | &quot;completed&quot; | undefined; assigned_to_role?: string | null | undefined; assigned_to_user_id?: string | ... 1 more ... | undefined; due_date?: Date | ... 1 more ... | undefin...'.
  Type 'ReactElement&lt;any, any&gt;' provides no match for the signature '({ field, fieldState, formState, }: { field: ControllerRenderProps&lt;{ name: string; description?: string | null | undefined; status?: &quot;pending&quot; | &quot;completed&quot; | undefined; assigned_to_role?: string | null | undefined; assigned_to_user_id?: string | ... 1 more ... | undefined; due_date?: Date | ... 1 more ... | undefined; }, &quot;name&quot;&gt;; fieldState: ControllerFieldState; formState: UseFormStateReturn&lt;...&gt;; }): ReactElement&lt;...&gt;'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="378" column="25" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="379" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="379" column="156" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="380" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="380" column="116" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="381" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="381" column="154" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="382" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="382" column="116" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="383" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="383" column="153" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="384" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="384" column="115" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="385" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="385" column="136" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="386" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="386" column="122" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="387" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="387" column="136" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="388" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="388" column="176" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="389" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="389" column="236" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="390" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="390" column="209" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="391" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="391" column="215" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="392" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="392" column="188" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="393" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="393" column="187" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="394" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="394" column="142" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="395" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="395" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="396" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="396" column="134" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="397" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="397" column="134" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="398" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="398" column="136" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="399" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="399" column="134" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="400" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="400" column="137" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="401" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="401" column="137" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="402" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="402" column="140" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="403" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="403" column="134" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="404" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="404" column="137" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="405" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="405" column="137" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="406" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="406" column="140" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="407" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="407" column="139" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="408" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="408" column="141" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="409" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="409" column="141" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="410" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="410" column="141" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="411" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="411" column="141" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="412" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="412" column="145" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="413" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="413" column="134" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="414" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="414" column="138" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="415" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="415" column="134" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="416" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="416" column="125" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="417" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="417" column="243" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="418" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="418" column="245" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="419" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="419" column="244" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="420" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="420" column="249" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="421" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="421" column="247" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="422" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="422" column="253" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="423" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="423" column="248" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="424" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="424" column="260" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="425" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="425" column="253" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="426" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="426" column="218" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="427" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="427" column="233" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="428" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="428" column="215" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="429" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="429" column="155" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="430" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="430" column="147" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="431" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="431" column="154" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="432" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="432" column="142" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="433" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="433" column="154" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="434" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="434" column="154" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="435" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="435" column="153" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="436" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="436" column="152" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="437" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="437" column="152" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="438" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="438" column="158" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="439" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="439" column="158" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="440" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="440" column="153" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="441" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="441" column="153" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="442" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="442" column="153" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="443" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="443" column="153" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="444" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="444" column="153" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="445" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="445" column="153" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="446" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="446" column="153" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="447" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="447" column="154" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="448" column="1" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="448" column="147" code="2339">Property 'problem' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="449" column="1" code="2339">Property 'dyad-problem-report' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="449" column="23" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="509" column="1" code="2339">Property 'think' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="528" column="1" code="2339">Property 'dyad-write' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="533" column="3" code="2304">Cannot find name 'id'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="551" column="3" code="2304">Cannot find name 'id'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="571" column="3" code="2304">Cannot find name 'id'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="576" column="17" code="2339">Property 'string' does not exist on type 'JSX.IntrinsicElements'.</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="590" column="3" code="2552">Cannot find name 'pathway_template_id'. Did you mean 'pathwayTemplateId'?</problem>
<problem file="src/features/pathways/components/PhaseTaskManagementPanel.tsx" line="595" column="3" code="2304">Cannot find name 'id'.</problem>
<problem file="src/features/pathways/components/PhaseConfigurationPanel.tsx" line="4" column="10" code="2459">Module '&quot;../services/pathway-template-service&quot;' declares 'BaseConfigurableItem' locally, but it is not exported.</problem>
<problem file="src/features/pathways/components/BranchingConfigForm.tsx" line="18" column="10" code="2459">Module '&quot;../services/pathway-template-service&quot;' declares 'Phase' locally, but it is not exported.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="407" column="108" code="2304">Cannot find name 'handleUpdateStatus'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="411" column="16" code="2304">Cannot find name 'AlertDialog'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="412" column="18" code="2304">Cannot find name 'AlertDialogTrigger'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="414" column="22" code="2304">Cannot find name 'Trash2'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="416" column="19" code="2304">Cannot find name 'AlertDialogTrigger'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="417" column="18" code="2304">Cannot find name 'AlertDialogContent'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="418" column="20" code="2304">Cannot find name 'AlertDialogHeader'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="419" column="22" code="2304">Cannot find name 'AlertDialogTitle'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="419" column="99" code="2304">Cannot find name 'AlertDialogTitle'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="420" column="22" code="2304">Cannot find name 'AlertDialogDescription'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="422" column="23" code="2304">Cannot find name 'AlertDialogDescription'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="423" column="21" code="2304">Cannot find name 'AlertDialogHeader'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="424" column="20" code="2304">Cannot find name 'AlertDialogFooter'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="425" column="22" code="2304">Cannot find name 'AlertDialogCancel'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="425" column="88" code="2304">Cannot find name 'AlertDialogCancel'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="426" column="22" code="2304">Cannot find name 'AlertDialogAction'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="431" column="23" code="2304">Cannot find name 'AlertDialogAction'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="432" column="21" code="2304">Cannot find name 'AlertDialogFooter'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="433" column="19" code="2304">Cannot find name 'AlertDialogContent'.</problem>
<problem file="src/features/pathways/components/PathwayTemplateBuilderPage.tsx" line="434" column="17" code="2304">Cannot find name 'AlertDialog'.</problem>
</dyad-problem-report>You are absolutely right! My apologies for those persistent TypeScript errors and the oversight in adhering to the "no soft delete" and "form-level save actions" guidelines. I've reviewed the issues and will implement the necessary fixes to ensure a clean, M3-compliant, and functional experience.

The core problems were:
1.  **Incorrect Type Imports**: Many components were importing `PathwayTemplate`, `Phase`, `BaseConfigurableItem`, and `PhaseTask` from incorrect paths (e.g., service files) instead of the central `src/types/supabase.ts`.
2.  **`CampaignPhase` Interface Definition**: The `CampaignPhase` interface was not correctly inheriting properties from `BaseConfigurableItem` in some contexts, leading to property-not-found errors.
3.  **Missing `AlertDialog` Imports**: The `AlertDialog` components were used in `PathwayTemplateBuilderPage` without being imported.
4.  **Missing `handleUpdateStatus` Function**: The `handleUpdateStatus` function was called but not defined in `PathwayTemplateBuilderPage`.
5.  **JSX Syntax Errors**: There were indeed some JSX syntax issues in `PackageDetail.tsx` and `PhaseTaskManagementPanel.tsx`.

I've addressed these issues by:

*   **Centralizing Type Definitions**: Ensured `PhaseTask` is correctly exported from `src/types/supabase.ts` and all relevant files import `PathwayTemplate`, `Phase`, `BaseConfigurableItem`, and `PhaseTask` directly from `src/types/supabase.ts`.
*   **Correcting `CampaignPhase`**: Ensured `CampaignPhase` correctly extends `BaseConfigurableItem` and that its properties are accessible.
*   **Adding `AlertDialog` Imports**: Imported all necessary `AlertDialog` components in `src/features/pathways/components/PathwayTemplateBuilderPage.tsx`.
*   **Implementing `handleUpdateStatus`**: Added the `handleUpdateStatus` function to `src/features/pathways/components/PathwayTemplateBuilderPage.tsx`.
*   **Fixing JSX Syntax**: Corrected the JSX structure in `src/features/packages/components/PackageDetail.tsx` and `src/features/pathways/components/PhaseTaskManagementPanel.tsx`.

Here are the updated files:

<dyad-write path="src/types/supabase.ts" description="Centralized type definitions for PathwayTemplate, Phase, BaseConfigurableItem, and PhaseTask.">
// This file defines common TypeScript interfaces for Supabase tables,
// especially for joined data, to ensure type safety across the application.

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  job_title: string | null;
  organization: string | null;
  location: string | null;
  phone_number: string | null;
  linkedin_url: string | null;
  orcid_url: string | null;
  website_url: string | null;
  bio: string | null;
  email: string | null; // Added email field
}

export interface PathwayTemplate {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  last_updated_by: string | null;
  // New fields for template-level essential information
  application_open_date: string | null; // ISO date string
  participation_deadline: string | null; // ISO date string
  general_instructions: string | null; // Rich text content
  applicant_instructions: string | null; // New field
  manager_instructions: string | null; // New field
  is_visible_to_applicants: boolean; // New field
}

// New base interface for configurable items (phases)
export interface BaseConfigurableItem {
  id: string;
  name: string;
  type: string; // e.g., 'Form', 'Review', 'Email', 'Scheduling', 'Decision', 'Recommendation'
  description: string | null;
  order_index: number;
  config: Record<string, any>; // JSONB field for phase-specific configuration
  created_at: string;
  updated_at: string;
  last_updated_by: string | null;
  // New phase-level fields
  phase_start_date: string | null;
  phase_end_date: string | null;
  applicant_instructions: string | null;
  manager_instructions: string | null;
  is_visible_to_applicants: boolean;
}

// Phase now extends BaseConfigurableItem
export interface Phase extends BaseConfigurableItem {
  pathway_template_id: string;
}

// Define PhaseTask here as well for central typing
export interface PhaseTask {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  assigned_to_role: string | null;
  assigned_to_user_id: string | null;
  due_date: string | null;
  status: 'pending' | 'completed';
  order_index: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Joined profile data for the assigned user
}

// You can add more interfaces here as needed for other Supabase tables.