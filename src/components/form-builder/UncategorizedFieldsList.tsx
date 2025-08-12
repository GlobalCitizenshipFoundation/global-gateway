import { FormFieldItem } from "@/components/FormFieldItem";
import { FormField } from "@/types";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { ListX } from "lucide-react"; // Import ListX for empty state

interface UncategorizedFieldsListProps {
  uncategorizedFields: FormField[];
  handleDeleteField: (fieldId: string) => Promise<void>;
  handleToggleRequired: (fieldId: string, isRequired: boolean) => Promise<void>;
  onEditLogic: (field: FormField) => void;
  onEditField: (field: FormField) => void;
  fieldTypeIcons: Record<FormField['field_type'], React.ElementType>; // New prop
}

// Helper component for droppable areas
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
  fieldTypeIcons,
}: UncategorizedFieldsListProps) => {
  if (uncategorizedFields.length === 0) {
    return (
      <div className="mt-6 border-t pt-6 rounded-md border p-4 text-muted-foreground text-sm text-center flex flex-col items-center">
        <ListX className="h-10 w-10 mb-2" />
        <p>No uncategorized fields.</p>
        <p>Fields without a section will appear here.</p>
      </div>
    );
  }

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
              onEditLogic={onEditLogic}
              onEdit={onEditField}
              fieldTypeIcons={fieldTypeIcons}
            />
          ))}
        </ul>
      </SortableContext>
    </DroppableContainer>
  );
};