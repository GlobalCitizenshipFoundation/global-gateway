import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/types';
import { GripVertical, Trash2, Eye, Pencil, Info } from 'lucide-react'; // Import Info icon
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
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

interface FormFieldItemProps {
  field: FormField;
  onDelete: (fieldId: string) => void;
  onToggleRequired: (fieldId: string, isRequired: boolean) => void;
  onEditLogic: (field: FormField) => void;
  onEdit: (field: FormField) => void;
}

export const FormFieldItem = ({ field, onDelete, onToggleRequired, onEditLogic, onEdit }: FormFieldItemProps) => {
  // Defensive check: If field is null or undefined, return null to prevent errors
  if (!field) {
    console.error("FormFieldItem received a null or undefined field prop.");
    return null;
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasLogic = field.display_rules && field.display_rules.length > 0;
  const hasTooltip = field.tooltip && field.tooltip.trim() !== ''; // Check for tooltip
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
            <span className="font-medium">{field.label}</span>
            <Badge variant="outline" className="ml-2 capitalize">{field.field_type}</Badge>
            {hasLogic && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Eye className="h-4 w-4 ml-2 inline-block text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  This field has conditional display logic.
                </TooltipContent>
              </Tooltip>
            )}
            {hasTooltip && ( // Display tooltip icon if tooltip exists
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-2 inline-block text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  {field.tooltip}
                </TooltipContent>
              </Tooltip>
            )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
            <Switch
                id={`required-${field.id}`}
                checked={field.is_required}
                onCheckedChange={(checked) => onToggleRequired(field.id, checked)}
            />
            <Label htmlFor={`required-${field.id}`}>Required</Label>
        </div>
        <Button variant="outline" size="sm" onClick={() => onEditLogic(field)}>
          {hasLogic ? 'Edit Logic' : 'Add Logic'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(field)}>
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
                This action cannot be undone. This will permanently delete the field
                <span className="font-semibold"> "{field.label}" </span>
                and any associated responses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(field.id)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
};