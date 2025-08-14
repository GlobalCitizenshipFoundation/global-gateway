import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ProgramStage } from "@/types";
import { Info } from "lucide-react";
import React from "react"; // Explicit React import

interface ApplicationStageStatusProps {
  stageType: ProgramStage['step_type'] | undefined | null;
  stageStatus: string | undefined | null;
}

type StatusDetails = {
  text: string;
  tooltip: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

const getStatusDetails = (stageType: ProgramStage['step_type'] | undefined | null, stageStatus: string | undefined | null): StatusDetails | null => {
  if (!stageType) return null;

  if (stageType === 'form') {
    switch (stageStatus) {
      case 'Not Submitted':
        return { text: 'Not Submitted', tooltip: 'Please complete and submit the form to proceed.', variant: 'destructive' };
      case 'In Progress':
        return { text: 'In Progress', tooltip: 'You have saved a draft. Continue editing and submit when ready.', variant: 'outline' };
      case 'Completed':
        return { text: 'Completed', tooltip: 'No further action is required.', variant: 'default' };
    }
  }

  if (stageType === 'resubmission') {
    switch (stageStatus) {
      case 'Awaiting Resubmission':
        return { text: 'Awaiting Resubmission', tooltip: 'Review the requested changes and resubmit the form.', variant: 'destructive' };
      case 'In Progress':
        return { text: 'In Progress', tooltip: 'You have saved a draft. Continue editing and submit when ready.', variant: 'outline' };
      case 'Completed':
        return { text: 'Completed', tooltip: 'No further action is required.', variant: 'default' };
    }
  }

  return null; // No special status for other stage types
};

export const ApplicationStageStatus = ({ stageType, stageStatus }: ApplicationStageStatusProps) => {
  const details = getStatusDetails(stageType, stageStatus);

  if (!details) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <Badge variant={details.variant}>{details.text}</Badge>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{details.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};