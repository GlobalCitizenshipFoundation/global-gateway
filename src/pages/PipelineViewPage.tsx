import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { ProgramStage } from "@/types";
import { Applicant, ApplicantCard } from "@/components/ApplicantCard";
import { KanbanColumn } from "@/components/KanbanColumn";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";

const PipelineViewPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [programTitle, setProgramTitle] = useState("");
  const [stages, setStages] = useState<ProgramStage[]>([]);
  const [applications, setApplications] = useState<Applicant[]>([]);
  const [activeApplicant, setActiveApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!programId) return;
      setLoading(true);

      const programPromise = supabase.from("programs").select("title").eq("id", programId).single();
      const stagesPromise = supabase.from("program_stages").select("*").eq("program_id", programId).order("order", { ascending: true });
      const applicationsPromise = supabase.from("applications").select("id, full_name, stage_id").eq("program_id", programId);

      const [
        { data: programData, error: programError },
        { data: stagesData, error: stagesError },
        { data: applicationsData, error: applicationsError },
      ] = await Promise.all([programPromise, stagesPromise, applicationsPromise]);

      if (programError || stagesError || applicationsError) {
        showError("Failed to load pipeline data.");
      } else {
        setProgramTitle(programData.title);
        setStages(stagesData);
        setApplications(applicationsData);
      }
      setLoading(false);
    };
    fetchData();
  }, [programId]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Applicant") {
      setActiveApplicant(event.active.data.current.applicant);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveApplicant(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeIsApplicant = active.data.current?.type === "Applicant";
    const overIsColumn = over.data.current?.type === "Column";

    if (activeIsApplicant && overIsColumn && active.data.current?.applicant.stage_id !== overId) {
      const applicantId = activeId as string;
      const newStageId = overId as string;
      
      // Optimistic update
      const originalApplications = applications;
      setApplications((apps) =>
        apps.map((app) => (app.id === applicantId ? { ...app, stage_id: newStageId } : app))
      );

      const { error } = await supabase
        .from("applications")
        .update({ stage_id: newStageId })
        .eq("id", applicantId);

      if (error) {
        showError("Failed to move applicant. Reverting.");
        setApplications(originalApplications);
      } else {
        showSuccess("Applicant moved successfully.");
      }
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-8 w-64 mb-8" />
        <div className="flex gap-4">
          <Skeleton className="w-72 h-96" />
          <Skeleton className="w-72 h-96" />
          <Skeleton className="w-72 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Link to={`/creator/program/${programId}/submissions`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Submissions
      </Link>
      <h1 className="text-3xl font-bold mb-8">Pipeline for: {programTitle}</h1>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext items={stages.map((s) => s.id)}>
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                applicants={applications.filter((app) => app.stage_id === stage.id)}
              />
            ))}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeApplicant ? <ApplicantCard applicant={activeApplicant} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default PipelineViewPage;