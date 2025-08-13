import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const WorkflowBuilderPage = () => {
  const { workflowId } = useParams<{ workflowId: string }>();

  return (
    <div className="container py-12">
      <Link to="/creator/workflows" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Workflows
      </Link>
      <h1 className="text-3xl font-bold">Workflow Builder</h1>
      <p className="text-muted-foreground">Workflow ID: {workflowId}</p>
      <div className="mt-8 p-8 border rounded-lg min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">The drag-and-drop interface for building workflows will be implemented here.</p>
      </div>
    </div>
  );
};

export default WorkflowBuilderPage;