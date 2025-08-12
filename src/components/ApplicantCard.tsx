import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export type Applicant = {
  id: string;
  full_name: string;
  stage_id: string;
};

interface ApplicantCardProps {
  applicant: Applicant;
}

export const ApplicantCard = ({ applicant }: ApplicantCardProps) => {
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
      <Card className={`mb-2 ${isDragging ? "opacity-50" : "opacity-100"}`}>
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium">{applicant.full_name}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};