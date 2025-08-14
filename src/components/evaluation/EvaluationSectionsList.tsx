import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CriterionCard } from "./CriterionCard";
import { EvaluationCriterion, EvaluationSection } from "@/types";
import { GripVertical, Trash2, Pencil, Plus } from "lucide-react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { CSS } from '@dnd-kit/utilities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import DOMPurify from 'dompurify';

interface EvaluationSectionsListProps {
  sections: EvaluationSection[];
  criteria: EvaluationCriterion[];
  loading: boolean;
  validationErrors: Map<string, string>;
  getCriteriaForSection: (sectionId: string | null) => EvaluationCriterion[];
  onDeleteSection: (sectionId: string) => Promise<void>;
  onDeleteCriterion: (criterionId: string) => void;
  onEditCriterion: (criterion: EvaluationCriterion) => void;
  onEditSection: (section: EvaluationSection) => void;
  onQuickAddCriterion: (sectionId: string) => void;
}

const DroppableContainer = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string; }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={cn(className, isOver && "ring-2 ring-blue-500 ring-offset-2")}>{children}</div>;
};

const SortableAccordionItem = ({ section, children, confirmDeleteSection, onQuickAddCriterion, onEditSection }: { section: EvaluationSection; children: React.ReactNode; confirmDeleteSection: (section: EvaluationSection) => void; onQuickAddCriterion: (sectionId: string) => void; onEditSection: (section: EvaluationSection) => void; }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id, data: { type: "Section", section } });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 0 };
  const sanitizedDescription = section.description ? DOMPurify.sanitize(section.description, { USE_PROFILES: { html: true } }) : null;

  return (
    <AccordionItem key={section.id} value={section.id} ref={setNodeRef} style={style} className={cn("rounded-md border mb-2", isDragging && "opacity-50")}>
      <div className="flex items-center justify-between w-full pr-4">
        <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}><GripVertical className="h-5 w-5 text-muted-foreground" /></Button>
        <AccordionTrigger className="flex-grow"><span className="font-semibold">{section.name}</span></AccordionTrigger>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEditSection(section); }}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onQuickAddCriterion(section.id); }}><Plus className="h-4 w-4 text-primary" /></Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); confirmDeleteSection(section); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>
      <AccordionContent className="px-6 pb-4">
        {sanitizedDescription && <div className="text-sm text-muted-foreground mb-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />}
        {children}
      </AccordionContent>
    </AccordionItem>
  );
};

export const EvaluationSectionsList = ({ sections, criteria, loading, validationErrors, getCriteriaForSection, onDeleteSection, onDeleteCriterion, onEditCriterion, onEditSection, onQuickAddCriterion }: EvaluationSectionsListProps) => {
  const [sectionToDelete, setSectionToDelete] = useState<EvaluationSection | null>(null);
  const [isSectionDeleteDialogOpen, setIsSectionDeleteDialogOpen] = useState(false);

  const confirmDeleteSection = (section: EvaluationSection) => {
    setSectionToDelete(section);
    setIsSectionDeleteDialogOpen(true);
  };

  const executeDeleteSection = async () => {
    if (sectionToDelete) {
      await onDeleteSection(sectionToDelete.id);
      setSectionToDelete(null);
      setIsSectionDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? <Skeleton className="h-24 w-full" /> : sections.length > 0 ? (
        <Accordion type="multiple" className="w-full">
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map(section => (
              <SortableAccordionItem key={section.id} section={section} confirmDeleteSection={confirmDeleteSection} onQuickAddCriterion={onQuickAddCriterion} onEditSection={onEditSection}>
                <DroppableContainer id={section.id} className="rounded-b-md">
                  <SortableContext items={getCriteriaForSection(section.id).map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2 p-2 min-h-[50px]">
                      {getCriteriaForSection(section.id).length > 0 ? (
                        getCriteriaForSection(section.id).map(criterion => (
                          <CriterionCard key={criterion.id} criterion={criterion} validationError={validationErrors.get(criterion.id) || null} onDelete={onDeleteCriterion} onEdit={onEditCriterion} />
                        ))
                      ) : <p className="text-muted-foreground text-sm text-center py-4">Drag criteria here or add new ones.</p>}
                    </ul>
                  </SortableContext>
                </DroppableContainer>
              </SortableAccordionItem>
            ))}
          </SortableContext>
        </Accordion>
      ) : <p className="text-muted-foreground text-sm">No sections defined yet. Add one to get started.</p>}
      <AlertDialog open={isSectionDeleteDialogOpen} onOpenChange={setIsSectionDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the section "{sectionToDelete?.name}". All criteria within it will become uncategorized.</AlertDialogDescription>
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