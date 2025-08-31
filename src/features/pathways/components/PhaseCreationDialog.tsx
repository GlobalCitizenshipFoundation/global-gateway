"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhaseDetailsForm } from "./PhaseDetailsForm"; // Reusing the PhaseDetailsForm

const phaseCreationSchema = z.object({
  name: z.string().min(1, { message: "Phase name is required." }).max(100, { message: "Name cannot exceed 100 characters." }),
  type: z.string().min(1, { message: "Phase type is required." }),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).nullable(),
});

interface PhaseCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pathwayTemplateId: string;
  onPhaseCreated: () => void;
  nextOrderIndex: number;
  canModify: boolean;
}

export function PhaseCreationDialog({
  isOpen,
  onClose,
  pathwayTemplateId,
  onPhaseCreated,
  nextOrderIndex,
  canModify,
}: PhaseCreationDialogProps) {
  const form = useForm<z.infer<typeof phaseCreationSchema>>({
    resolver: zodResolver(phaseCreationSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        type: "",
        description: "",
      });
    }
  }, [isOpen, form]);

  const handleSave = () => {
    onPhaseCreated();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-xl shadow-lg bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-headline-small">Add New Phase</DialogTitle>
          <DialogDescription className="text-body-medium text-muted-foreground">
            Define a new phase for your pathway template.
          </DialogDescription>
        </DialogHeader>
        <PhaseDetailsForm
          pathwayTemplateId={pathwayTemplateId}
          onPhaseSaved={handleSave}
          onCancel={onClose}
          nextOrderIndex={nextOrderIndex}
          canModify={canModify}
        />
      </DialogContent>
    </Dialog>
  );
}