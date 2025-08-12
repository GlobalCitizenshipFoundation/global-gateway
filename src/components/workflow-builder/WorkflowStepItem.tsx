import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WorkflowStep } from '@/types';
import { GripVertical, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';

interface WorkflowStepItemProps {
  step: WorkflowStep;
  onDelete: (stepId: string) => void;
  onSelectStep: (step: WorkflowStep) => void;
  onUpdateName: (stepId: string, newName: string) => void;
}

export const WorkflowStepItem = ({ step, onDelete, onSelectStep, onUpdateName }: WorkflowStepItemProps) => {
  if (!step) {
    console.error("WorkflowStepItem received a null or undefined step prop.");
    return null;
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: step.id, data: { type: "WorkflowStep", step } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(step.name);

  const handleNameDoubleClick = () => {
    setIsEditingName(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameBlur = () => {
    if (editedName.trim() !== step.name) {
      onUpdateName(step.id, editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-secondary rounded-md gap-4"
    >
      <div className="flex items-center gap-2 flex-grow">
        <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
        <div className="flex-grow">
            {isEditingName ? (
                <Input
                    value={editedName}
                    onChange={handleNameChange}
                    onBlur={handleNameBlur}
                    onKeyDown={handleNameKeyDown}
                    autoFocus
                    className="h-8 text-base"
                />
            ) : (
                <span className="font-medium cursor-pointer" onDoubleClick={handleNameDoubleClick}>
                    {step.name}
                </span>
            )}
            <Badge variant="outline" className="ml-2 capitalize">{step.step_type}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => onSelectStep(step)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </Button>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the step
                <span className="font-semibold"> "{step.name}" </span>
                from this workflow template.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(step.id)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
};