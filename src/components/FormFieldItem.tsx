import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormField } from '@/types';
import { GripVertical, Trash2, Eye } from 'lucide-react'; // Import Eye icon
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'; // Import Tooltip

interface FormFieldItemProps {
  field: FormField;
  onDelete: (fieldId: string) => void;
  onToggleRequired: (fieldId: string, isRequired: boolean) => void;
  onEditLogic: (field: FormField) => void; // New prop for editing logic
}

export const FormFieldItem = ({ field, onDelete, onToggleRequired, onEditLogic }: FormFieldItemProps) => {
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
        <Button variant="ghost" size="icon" onClick={() => onDelete(field.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </li>
  );
};