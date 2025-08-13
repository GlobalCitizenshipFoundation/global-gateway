import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Pencil } from 'lucide-react';
import { EvaluationCriterion } from '@/types';
import { Badge } from '../ui/badge';

interface CriterionCardProps {
  criterion: EvaluationCriterion;
  onDelete: (criterionId: string) => void;
  onEdit: (criterion: EvaluationCriterion) => void;
}

export const CriterionCard = ({ criterion, onDelete, onEdit }: CriterionCardProps) => {
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
    number_scale: "Number Scale",
    pass_fail: "Pass / Fail",
    text: "Text Response",
    select: "Dropdown",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div>
              <CardTitle className="text-lg">{criterion.label}</CardTitle>
              <CardDescription>
                <Badge variant="secondary" className="capitalize">{typeLabels[criterion.criterion_type]}</Badge>
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