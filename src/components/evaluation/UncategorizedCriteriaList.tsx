import { CriterionCard } from "./CriterionCard";
import { EvaluationCriterion } from "@/types";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface UncategorizedCriteriaListProps {
  uncategorizedCriteria: EvaluationCriterion[];
  validationErrors: Map<string, string>;
  onDelete: (criterionId: string) => void;
  onEdit: (criterion: EvaluationCriterion) => void;
}

const DroppableContainer = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string; }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={cn(className, isOver && "ring-2 ring-blue-500 ring-offset-2")}>{children}</div>;
};

export const UncategorizedCriteriaList = ({
  uncategorizedCriteria,
  validationErrors,
  onDelete,
  onEdit,
}: UncategorizedCriteriaListProps) => {
  if (uncategorizedCriteria.length === 0) return null;

  return (
    <DroppableContainer id="uncategorized-criteria-droppable-area" className="mt-6 border-t pt-6 rounded-md border">
      <h3 className="text-lg font-medium mb-4 px-2">Uncategorized Criteria</h3>
      <SortableContext items={uncategorizedCriteria.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2 p-2 min-h-[50px]">
          {uncategorizedCriteria.map(criterion => (
            <CriterionCard
              key={criterion.id}
              criterion={criterion}
              validationError={validationErrors.get(criterion.id) || null}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </ul>
      </SortableContext>
    </DroppableContainer>
  );
};