import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormFieldItem } from "@/components/forms/form-builder/FormFieldItem";
import { FormField, FormSection } from "@/types";
import { GripVertical, Trash2, Info } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import DOMPurify from 'dompurify';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormSectionsListProps {
  sections: FormSection[];
  fields: FormField[];
  loading: boolean;
  getFieldsForSection: (sectionId: string | null) => FormField[];
  handleDeleteSection: (sectionId: string, fieldAction: 'delete_fields' | 'uncategorize_fields' | 'move_to_section', targetSectionId?: string | null) => Promise<void>;
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

const SortableAccordionItem = ({ section, children, confirmDeleteSection }: { section: FormSection; children: React.ReactNode; confirmDeleteSection: (section: FormSection) => void; }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { type: "Section", section } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  const hasTooltip = section.tooltip && section.tooltip.trim() !== '';
  const sanitizedDescription = section.description ? DOMPurify.sanitize(section.description, { USE_PROFILES: { html: true } }) : null;

  return (
    <AccordionItem
      key={section.id}
      value={section.id}
      ref={setNodeRef}
      style={style}
      className={cn("rounded-md border mb-2", isDragging && "opacity-50")}
    >
      <div className="flex items-center justify-between w-full pr-4">
        <Button variant="ghost" size="icon" className="cursor-grab" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
        <AccordionTrigger className="flex-grow flex justify-between items-center pr-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{section.name}</span>
            {hasTooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-800 text-white p-2 rounded-md text-sm">
                  {section.tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </AccordionTrigger>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); confirmDeleteSection(section); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <AccordionContent className="px-6 pb-4">
        {sanitizedDescription && (
          <div className="text-sm text-muted-foreground mb-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
        )}
        {children}
      </AccordionContent>
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
  onUpdateLabel,
  onSelectField,
}: FormSectionsListProps) => {
  const [sectionToDelete, setSectionToDelete] = useState<FormSection | null>(null);
  const [isSectionDeleteDialogOpen, setIsSectionDeleteDialogOpen] = useState(false);
  const [fieldAction, setFieldAction] = useState<'delete_fields' | 'uncategorize_fields' | 'move_to_section'>('uncategorize_fields');
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

  const confirmDeleteSection = (section: FormSection) => {
    setSectionToDelete(section);
    setFieldAction('uncategorize_fields'); // Reset to default option
    setTargetSectionId(null); // Reset target section
    setIsSectionDeleteDialogOpen(true);
  };

  const executeDeleteSection = async () => {
    if (sectionToDelete) {
      await handleDeleteSection(sectionToDelete.id, fieldAction, targetSectionId);
      setSectionToDelete(null);
      setIsSectionDeleteDialogOpen(false);
    }
  };

  const fieldsInSectionToDelete = sectionToDelete ? getFieldsForSection(sectionToDelete.id) : [];
  const hasFields = fieldsInSectionToDelete.length > 0;
  const otherSections = sections.filter(s => s.id !== sectionToDelete?.id);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Form Sections</h3>
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : sections.length > 0 ? (
        <Accordion type="multiple" className="w-full">
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map(section => (
              <SortableAccordionItem key={section.id} section={section} confirmDeleteSection={confirmDeleteSection}>
                <DroppableContainer id={section.id} className="rounded-b-md">
                  <SortableContext items={getFieldsForSection(section.id).map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2 p-2 min-h-[50px]">
                      {getFieldsForSection(section.id).length > 0 ? (
                        getFieldsForSection(section.id).map(field => (
                          <FormFieldItem
                            key={field.id}
                            field={field}
                            onDelete={handleDeleteField}
                            onToggleRequired={handleToggleRequired}
                            onUpdateLabel={onUpdateLabel}
                            onSelectField={onSelectField}
                          />
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">Drag fields here or add new ones below.</p>
                      )}
                    </ul>
                  </SortableContext>
                </DroppableContainer>
              </SortableAccordionItem>
            ))}
          </SortableContext>
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
              <span className="font-semibold"> "{sectionToDelete?.name}"</span>.
              {hasFields && (
                <div className="mt-4">
                  <p className="font-medium mb-2">This section contains {fieldsInSectionToDelete.length} field(s). What would you like to do with them?</p>
                  <RadioGroup value={fieldAction} onValueChange={(value: 'delete_fields' | 'uncategorize_fields' | 'move_to_section') => setFieldAction(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="uncategorize_fields" id="uncategorize-fields" />
                      <Label htmlFor="uncategorize-fields">Move fields to "Uncategorized"</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delete_fields" id="delete-fields" />
                      <Label htmlFor="delete-fields">Permanently delete fields</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="move_to_section" id="move-to-section" disabled={otherSections.length === 0} />
                      <Label htmlFor="move-to-section">Move fields to another section</Label>
                    </div>
                  </RadioGroup>
                  {fieldAction === 'move_to_section' && otherSections.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      <Label htmlFor="target-section">Select Target Section</Label>
                      <Select value={targetSectionId || ''} onValueChange={setTargetSectionId}>
                        <SelectTrigger id="target-section">
                          <SelectValue placeholder="Choose a section" />
                        </SelectTrigger>
                        <SelectContent>
                          {otherSections.map(section => (
                            <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {fieldAction === 'move_to_section' && otherSections.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">No other sections available to move fields to.</p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSectionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteSection}
              disabled={fieldAction === 'move_to_section' && !targetSectionId}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};