import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/types';
import { GripVertical, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface FormFieldItemProps {
  field: FormField;
  onDelete: (fieldId: string) => void;
  onToggleRequired: (fieldId: string, isRequired: boolean) => void;
}

export const FormFieldItem = ({ field, onDelete, onToggleRequired }: FormFieldItemProps) => {
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
        <Button variant="ghost" size="icon" onClick={() => onDelete(field.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </li>
  );
};