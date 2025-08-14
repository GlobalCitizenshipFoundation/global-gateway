import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CriterionCard } from "./CriterionCard";
import { EvaluationCriterion, EvaluationSection } from "@/types";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { CSS } from '@dnd-kit/utilities';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import DOMPurify from 'dompurify';
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { GripVertical, Trash2, Pencil, Plus, Eye } from 'lucide-react'; // Added missing Lucide icons

interface EvaluationSectionsListProps {
  sections: EvaluationSection[];
  criteria: EvaluationCriterion[];
  loading: boolean;
  validationErrors: Map<string, string>;
  getCriteriaForSection: (sectionId: string | null) => EvaluationCriterion[];
  onDeleteSection: (sectionId: string, action: 'delete_criteria' | 'uncategorize_criteria') => Promise<void>;
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
        <AccordionTrigger className="flex-grow">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{section.name}</span>
            {section.is_public && (
              <Tooltip>
                <TooltipTrigger asChild><Eye className="h-4 w-4 text-blue-500" /></TooltipTrigger>
                <TooltipContent><p>This section is public.</p></TooltipContent>
              </Tooltip>
            )}
          </div>
        </AccordionTrigger>
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

  const executeDeleteSection = async (action: 'delete_criteria' | 'uncategorize_criteria') => {
    if (sectionToDelete) {
      await onDeleteSection(sectionToDelete.id, action);
      setSectionToDelete(null);
      setIsSectionDeleteDialogOpen(false);
    }
  };

  const criteriaInSectionCount = sectionToDelete ? getCriteriaForSection(sectionToDelete.id).length : 0;

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
        <AlertDialogContent key={isSectionDeleteDialogOpen ? 'section-delete-open' : 'section-delete-closed'}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section "{sectionToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This section contains {criteriaInSectionCount} criteria. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel onClick={() => setSectionToDelete(null)}>Cancel</AlertDialogCancel>
            <div className="flex flex-col-reverse sm:flex-row sm:gap-2">
              <Button variant="outline" onClick={() => executeDeleteSection('uncategorize_criteria')}>Delete Section Only</Button>
              <AlertDialogAction onClick={() => executeDeleteSection('delete_criteria')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Section & Criteria</AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};