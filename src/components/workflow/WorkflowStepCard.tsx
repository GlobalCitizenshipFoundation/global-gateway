import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { WorkflowStep } from '@/types';
import { Badge } from '../ui/badge';

interface WorkflowStepCardProps {
  step: WorkflowStep;
  onDelete: (stepId: string) => void;
}

export const WorkflowStepCard = ({ step, onDelete }: WorkflowStepCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, data: { type: "Step", step } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
              <CardTitle className="text-lg">{step.name}</CardTitle>
              <CardDescription>
                <Badge variant="secondary" className="capitalize">{step.step_type}</Badge>
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDelete(step.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
};