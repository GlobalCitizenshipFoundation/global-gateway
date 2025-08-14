import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EvaluationCriterion } from '@/types';
import { DynamicReviewForm } from '../review/DynamicReviewForm';

interface EvaluationTemplatePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  criteria: EvaluationCriterion[];
}

export const EvaluationTemplatePreviewDialog = ({
  isOpen,
  onClose,
  templateName,
  criteria,
}: EvaluationTemplatePreviewDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{templateName} - Preview</DialogTitle>
          <DialogDescription>
            This is how the scorecard will appear to reviewers. All fields are interactive for demonstration.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <DynamicReviewForm
            criteria={criteria}
            onSubmit={async () => { /* No-op for preview */ }}
            isSubmitting={false}
            isPreview={true}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};