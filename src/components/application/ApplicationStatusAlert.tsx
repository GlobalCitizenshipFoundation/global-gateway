import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { ProgramStage } from "@/types";
import DOMPurify from 'dompurify';

interface ApplicationStatusAlertProps {
  stage: {
    name: string;
    description: string | null;
    step_type: ProgramStage['step_type'];
  };
}

type StatusConfig = {
  message: string;
  tag: string;
  custom_tag?: string;
};

export const ApplicationStatusAlert = ({ stage }: ApplicationStatusAlertProps) => {
  if (stage.step_type !== 'status' || !stage.description) {
    return null;
  }

  let config: StatusConfig | null = null;
  try {
    config = JSON.parse(stage.description);
  } catch (e) {
    // If not valid JSON, treat the whole description as the message
    config = { message: stage.description, tag: 'Info' };
  }

  if (!config || !config.message) {
    return null;
  }

  const tag = config.tag === 'Custom' ? config.custom_tag : config.tag;
  const sanitizedMessage = DOMPurify.sanitize(config.message, { USE_PROFILES: { html: true } });

  return (
    <Alert className="mt-4">
      <Terminal className="h-4 w-4" />
      <AlertTitle>{tag || 'Status Update'}</AlertTitle>
      <AlertDescription>
        <div dangerouslySetInnerHTML={{ __html: sanitizedMessage }} className="prose max-w-none" />
      </AlertDescription>
    </Alert>
  );
};