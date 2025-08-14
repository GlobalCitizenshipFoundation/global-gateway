import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/types';
import { GripVertical, Trash2, Eye, Pencil, Info, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { cn } from '@/lib/utils';

interface FormFieldItemProps {
  field: FormField;
  onDelete: (fieldId: string) => void;
  onToggleRequired: (fieldId: string, isRequired: boolean) => void;
  onSelectField: (field: FormField) => void;
  onUpdateLabel: (fieldId: string, newLabel: string) => void;
}

export const FormFieldItem = ({ field, onDelete, onToggleRequired, onSelectField, onUpdateLabel }: FormFieldItemProps) => {
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
  } = useSortable({ id: field.id, data: { type: "FormField", field } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasLogic = field.display_rules && field.display_rules.length > 0;
  const hasTooltip = field.tooltip && field.tooltip.trim() !== '';
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(field.label);

  const handleLabelDoubleClick = () => {
    setIsEditingLabel(true);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedLabel(e.target.value);
  };

  const handleLabelBlur = () => {
    if (editedLabel.trim() !== field.label) {
      onUpdateLabel(field.id, editedLabel.trim());
    }
    setIsEditingLabel(false);
  };

  const handleLabelKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 bg-secondary rounded-md gap-4",
        hasLogic && "border-l-4 border-blue-500"
      )}
    >
      <div className="flex items-center gap-2 flex-grow">
        <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
        <div className="flex-grow">
            {isEditingLabel ? (
                <Input
                    value={editedLabel}
                    onChange={handleLabelChange}
                    onBlur={handleLabelBlur}
                    onKeyDown={handleLabelKeyDown}
                    autoFocus
                    className="h-8 text-base"
                />
            ) : (
                <span className="font-medium cursor-pointer" onDoubleClick={handleLabelDoubleClick}>
                    {field.label}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                </span>
            )}
            <Badge variant="outline" className="ml-2 capitalize">{field.field_type}</Badge>
            {field.is_anonymized && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Shield className="h-4 w-4 ml-2 inline-block text-destructive" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded-md text-sm">
                  This field is anonymized and will be hidden from reviewers.
                </TooltipContent>
              </Tooltip>
            )}
            {hasLogic && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Eye className="h-4 w-4 ml-2 inline-block text-blue-500" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded-md text-sm">
                  This field has conditional display logic.
                </TooltipContent>
              </Tooltip>
            )}
            {hasTooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-2 inline-block text-gray-500" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded-md text-sm">
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
        <Button variant="outline" size="sm" onClick={() => onSelectField(field)}>
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