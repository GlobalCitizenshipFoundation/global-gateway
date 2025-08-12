import React, { useMemo } from "react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { ProgramStage } from "@/types";
import { Applicant, ApplicantCard } from "./ApplicantCard";
import { CSS } from '@dnd-kit/utilities'; // Import CSS for transform

interface KanbanColumnProps {
  stage: ProgramStage;
  applicants: Applicant[];
  onApplicantClick: (applicant: Applicant) => void;
}

export const KanbanColumn = React.memo(({ stage, applicants, onApplicantClick }: KanbanColumnProps) => {
  const applicantIds = useMemo(() => applicants.map((app) => app.id), [applicants]);

  const { setNodeRef, transform, transition } = useSortable({
    id: stage.id,
    data: {
      type: "Column",
      stage,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 flex-shrink-0 bg-muted/50 rounded-lg p-2 cursor-grab" // Added cursor-grab
    >
      <h3 className="font-semibold p-2 mb-2">{stage.name}</h3>
      <div className="min-h-[100px]">
        <SortableContext items={applicantIds}>
          {applicants.map((applicant) => (
            <ApplicantCard
              key={applicant.id}
              applicant={applicant}
              onClick={() => onApplicantClick(applicant)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
});