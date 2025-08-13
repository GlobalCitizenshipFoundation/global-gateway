import { FormFieldItem } from "@/components/forms/form-builder/FormFieldItem";
import { FormField } from "@/types";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface UncategorizedFieldsListProps {
  uncategorizedFields: FormField[];
  handleDeleteField: (fieldId: string) => Promise<void>;
  handleToggleRequired: (fieldId: string, isRequired: boolean) => Promise<void>;
  onEditLogic: (field: FormField) => void;
  onEditField: (field: FormField) => void;
  onUpdateLabel: (fieldId: string, newLabel: string) => void;
  onSelectField: (field: FormField) => void;
}

const DroppableContainer = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string; }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={cn(className, isOver && "ring-2 ring-blue-500 ring-offset-2")}>{children}</div>;
};

export const UncategorizedFieldsList = ({
  uncategorizedFields,
  handleDeleteField,
  handleToggleRequired,
  onEditLogic,
  onEditField,
  onUpdateLabel,
  onSelectField,
}: UncategorizedFieldsListProps) => {
  if (uncategorizedFields.length === 0) return null;

  return (
    <DroppableContainer id="uncategorized-fields-droppable-area" className="mt-6 border-t pt-6 rounded-md border">
      <h3 className="text-lg font-medium mb-4 px-2">Uncategorized Fields</h3>
      <SortableContext items={uncategorizedFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2 p-2 min-h-[50px]">
          {uncategorizedFields.map(field => (
            <FormFieldItem
              key={field.id}
              field={field}
              onDelete={handleDeleteField}
              onToggleRequired={handleToggleRequired}
              onUpdateLabel={onUpdateLabel}
              onSelectField={onSelectField}
            />
          ))}
        </ul>
      </SortableContext>
    </DroppableContainer>
  );
};