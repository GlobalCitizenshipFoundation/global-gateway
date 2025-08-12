import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { ProgramStage } from "@/types";
import { Applicant, ApplicantCard } from "./ApplicantCard";
import { useMemo } from "react";

interface KanbanColumnProps {
  stage: ProgramStage;
  applicants: Applicant[];
  onApplicantClick: (applicant: Applicant) => void;
}

export const KanbanColumn = ({ stage, applicants, onApplicantClick }: KanbanColumnProps) => {
  const applicantIds = useMemo(() => applicants.map((app) => app.id), [applicants]);

  const { setNodeRef } = useSortable({
    id: stage.id,
    data: {
      type: "Column",
      stage,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="w-72 flex-shrink-0 bg-muted/50 rounded-lg p-2"
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
};