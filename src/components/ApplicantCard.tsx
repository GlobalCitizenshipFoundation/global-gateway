import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CSS } from '@dnd-kit/utilities'; // Import CSS for transform

export type Applicant = {
  id: string;
  full_name: string;
  stage_id: string;
};

interface ApplicantCardProps {
  applicant: Applicant;
  onClick: () => void;
}

export const ApplicantCard = React.memo(({ applicant, onClick }: ApplicantCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: applicant.id, data: { type: "Applicant", applicant } });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`mb-2 ${isDragging ? "opacity-50 shadow-lg" : "opacity-100"} cursor-grab hover:ring-2 hover:ring-ring`} // Added shadow-lg and cursor-grab
        onClick={onClick}
      >
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium">{applicant.full_name}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
});