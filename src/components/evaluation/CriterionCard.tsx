import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Pencil, AlertTriangle, Eye } from 'lucide-react';
import { EvaluationCriterion } from '@/types';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CriterionCardProps {
  criterion: EvaluationCriterion;
  validationError: string | null;
  onDelete: (criterionId: string) => void;
  onEdit: (criterion: EvaluationCriterion) => void;
}

export const CriterionCard = ({ criterion, validationError, onDelete, onEdit }: CriterionCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: criterion.id, data: { type: "Criterion", criterion } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeLabels: Record<EvaluationCriterion['criterion_type'], string> = {
    numerical_score: "Numerical Score",
    number_scale: "Number Scale",
    single_select: "Single Select",
    repeater_buttons: "Repeater Buttons",
    short_text: "Short Text",
    long_text: "Long Text",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-2">
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <div className="flex items-center gap-2 flex-grow">
            <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="flex-grow">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {criterion.label}
                {criterion.is_public && (
                  <Tooltip>
                    <TooltipTrigger asChild><Eye className="h-4 w-4 text-blue-500" /></TooltipTrigger>
                    <TooltipContent><p>This criterion is public.</p></TooltipContent>
                  </Tooltip>
                )}
                {validationError && (
                  <Tooltip>
                    <TooltipTrigger asChild><AlertTriangle className="h-4 w-4 text-destructive" /></TooltipTrigger>
                    <TooltipContent><p>{validationError}</p></TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize">{typeLabels[criterion.criterion_type] || 'Unknown'}</Badge>
                <Badge variant="outline">Weight: {criterion.weight}</Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(criterion)}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(criterion.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};