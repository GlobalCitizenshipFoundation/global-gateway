import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { WorkflowStage } from '@/types';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface WorkflowStageCardProps {
  stage: WorkflowStage;
  validationError: string | null;
  onDelete: (stageId: string) => void;
  onEdit: (stage: WorkflowStage) => void;
}

export const WorkflowStageCard = ({ stage, validationError, onDelete, onEdit }: WorkflowStageCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, data: { type: "Stage", stage } });

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
              <CardTitle className="text-lg flex items-center gap-2">
                {stage.name}
                {validationError && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{validationError}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardTitle>
              {/* Changed CardDescription to a div to allow Badge (which is a div) to be a child */}
              <div className="text-sm text-muted-foreground">
                <Badge variant="secondary" className="capitalize">{stage.step_type}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(stage)}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(stage.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};