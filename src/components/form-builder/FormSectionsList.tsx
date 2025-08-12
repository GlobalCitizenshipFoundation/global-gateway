import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldItem } from "@/components/FormFieldItem";
import { FormField, FormSection } from "@/types";
import { Trash2 } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
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
}

// Helper component for droppable areas
const DroppableContainer = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string; }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={cn(className, isOver && "ring-2 ring-blue-500 ring-offset-2")}>{children}</div>;
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
          {sections.map(section => (
            <AccordionItem key={section.id} value={section.id}>
              <DroppableContainer id={section.id} className="rounded-md border">
                <AccordionTrigger className="flex justify-between items-center w-full pr-4">
                  <span className="font-semibold">{section.name}</span>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); confirmDeleteSection(section); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AccordionTrigger>
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
                          />
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">Drag fields here or add new ones below.</p>
                      )}
                    </ul>
                  </SortableContext>
                </AccordionContent>
              </DroppableContainer>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-muted-foreground text-sm">No sections defined yet. Add one to get started.</p>
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