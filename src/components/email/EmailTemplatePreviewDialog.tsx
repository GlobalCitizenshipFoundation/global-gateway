import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmailTemplate } from '@/types';
import DOMPurify from 'dompurify';

interface EmailTemplatePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
}

export const EmailTemplatePreviewDialog = ({ isOpen, onClose, template }: EmailTemplatePreviewDialogProps) => {
  if (!template) return null;

  const sanitizedBody = DOMPurify.sanitize(template.body, { USE_PROFILES: { html: true } });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Preview: {template.name}</DialogTitle>
          <DialogDescription>Subject: {template.subject}</DialogDescription>
          <DialogDescription>
            This is how your email will appear. Note that some email clients may render HTML differently.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 border rounded-md p-4 bg-muted/20">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedBody }} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close Preview</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};