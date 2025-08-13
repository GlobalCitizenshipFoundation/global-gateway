import { useSortable } from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export type Applicant = {
  id: string;
  full_name: string;
  stage_id: string;
};

interface ApplicantCardProps {
  applicant: Applicant;
  onClick: () => void;
}

export const ApplicantCard = ({ applicant, onClick }: ApplicantCardProps) => {
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
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`mb-2 ${isDragging ? "opacity-50" : "opacity-100"} cursor-pointer hover:ring-2 hover:ring-ring`}
        onClick={onClick}
      >
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium">{applicant.full_name}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};