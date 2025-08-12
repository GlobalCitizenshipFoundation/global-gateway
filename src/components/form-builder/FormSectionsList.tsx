import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldItem } from "@/components/FormFieldItem";
import { FormField, FormSection } from "@/types";
import { GripVertical, Trash2, LayoutList } from "lucide-react"; // Import LayoutList for empty state
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { CSS } from '@dnd-kit/utilities';
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
import { useState } from "react";

interface FormSectionsListProps {
  sections: FormSection[];
  fields: FormField[];
  loading: boolean;
  getFieldsForSection: (sectionId: string | null) => FormField[];
  handleDeleteSection: (sectionId: string) => Promise<void>;
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

// Sortable Accordion Item for Sections
const SortableAccordionItem = ({ section, children, confirmDeleteSection, isDragging }: { section: FormSection; children: React.ReactNode; confirmDeleteSection: (section: FormSection) => void; isDragging: boolean; }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id, data: { type: "Section", section } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <AccordionItem
      key={section.id}
      value={section.id}
      ref={setNodeRef}
      style={style}
      className={cn("rounded-md border mb-2", isDragging && "opacity-50")}
    >
      <AccordionTrigger className="flex justify-between items-center pr-4 cursor-grab">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
          <span className="font-semibold">{section.name}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); confirmDeleteSection(section); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AccordionTrigger>
      {children}
    </AccordionItem>
  );
};

export const FormSectionsList = ({
  sections,
  fields,
  loading,
  getFieldsForSection,
  handleDeleteSection,
  handleDeleteField,
  handleToggleRequired,
  onEditLogic,
  onEditField,
  fieldTypeIcons,
}: FormSectionsListProps) => {
  const [sectionToDelete, setSectionToDelete] = useState<FormSection | null>(null);
  const [isSectionDeleteDialogOpen, setIsSectionDeleteDialogOpen] = useState(false);

  const confirmDeleteSection = (section: FormSection) => {
    setSectionToDelete(section);
    setIsSectionDeleteDialogOpen(true);
  };

  const executeDeleteSection = async () => {
    if (sectionToDelete) {
      await handleDeleteSection(sectionToDelete.id);
      setSectionToDelete(null);
      setIsSectionDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Form Sections</h3>
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : sections.length > 0 ? (
        <Accordion type="multiple" className="w-full">
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map(section => (
              <SortableAccordionItem key={section.id} section={section} confirmDeleteSection={confirmDeleteSection} isDragging={false}> {/* isDragging prop added */}
                <DroppableContainer id={section.id} className="rounded-b-md">
                  <AccordionContent>
                    <SortableContext items={getFieldsForSection(section.id).map(f => f.id)} strategy={verticalListSortingStrategy}>
                      <ul className="space-y-2 p-2 min-h-[50px]">
                        {getFieldsForSection(section.id).length > 0 ? (
                          getFieldsForSection(section.id).map(field => (
                            <FormFieldItem
                              key={field.id}
                              field={field}
                              onDelete={handleDeleteField}
                              onToggleRequired={handleToggleRequired}
                              onEditLogic={onEditLogic}
                              onEdit={onEditField}
                              fieldTypeIcons={fieldTypeIcons}
                            />
                          ))
                        ) : (
                          <div className="text-muted-foreground text-sm text-center py-4 flex flex-col items-center">
                            <LayoutList className="h-8 w-8 mb-2" />
                            <p>Drag fields here or add new ones below.</p>
                          </div>
                        )}
                      </ul>
                    </SortableContext>
                  </AccordionContent>
                </DroppableContainer>
              </SortableAccordionItem>
            ))}
          </SortableContext>
        </Accordion>
      ) : (
        <div className="text-muted-foreground text-sm text-center py-8 flex flex-col items-center border rounded-md">
          <LayoutList className="h-12 w-12 mb-4" />
          <p>No sections defined yet.</p>
          <p>Add a new section below to organize your form fields.</p>
        </div>
      )}

      <AlertDialog open={isSectionDeleteDialogOpen} onOpenChange={setIsSectionDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the section
              <span className="font-semibold"> "{sectionToDelete?.name}" </span>
              and move all its associated fields to the "Uncategorized Fields" list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSectionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteSection}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};