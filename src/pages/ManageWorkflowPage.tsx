import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Program, ProgramStage, WorkflowStep } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import { ArrowLeft, Plus, Trash2, Link as LinkIcon, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

const ManageWorkflowPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [stages, setStages] = useState<ProgramStage[]>([]);
  const [templateSteps, setTemplateSteps] = useState<WorkflowStep[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkflow = async () => {
    if (!programId) return;
    setLoading(true);

    const { data: programData, error: programError } = await supabase
      .from('programs')
      .select('title, workflow_template_id')
      .eq('id', programId)
      .single();

    if (programError || !programData) {
      showError("Could not fetch program details.");
      setLoading(false);
      return;
    }
    setProgram(programData as Program);

    if (programData.workflow_template_id) {
      const { data: stepsData, error: stepsError } = await supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_template_id', programData.workflow_template_id)
        .order('order_index', { ascending: true });
      
      if (stepsError) {
        showError("Could not fetch template steps.");
      } else {
        setTemplateSteps(stepsData || []);
      }
    }

    const { data: stagesData, error: stagesError } = await supabase
      .from('program_stages')
      .select('*')
      .eq('program_id', programId)
      .order('order', { ascending: true });

    if (stagesError) {
      showError("Could not fetch workflow stages.");
    } else {
      setStages(stagesData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkflow();
  }, [programId]);

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim() || !programId) return;

    setIsSubmitting(true);
    const nextOrder = stages.length > 0 ? Math.max(...stages.map(s => s.order)) + 1 : 1;

    const { data, error } = await supabase
      .from('program_stages')
      .insert({
        program_id: programId,
        name: newStageName,
        order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      showError(`Failed to add stage: ${error.message}`);
    } else if (data) {
      setStages([...stages, data]);
      setNewStageName('');
      showSuccess("Stage added successfully.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteStage = async (stageId: string) => {
    const { error } = await supabase
      .from('program_stages')
      .delete()
      .eq('id', stageId);

    if (error) {
      showError(`Failed to delete stage: ${error.message}`);
    } else {
      setStages(stages.filter(s => s.id !== stageId));
      showSuccess("Stage deleted successfully.");
    }
  };

  const handleApplyTemplate = async () => {
    if (!programId || !program?.workflow_template_id || templateSteps.length === 0) {
      showError("No template steps to apply.");
      return;
    }

    // 1. Delete existing program stages
    const { error: deleteError } = await supabase
      .from('program_stages')
      .delete()
      .eq('program_id', programId);

    if (deleteError) {
      showError(`Failed to clear existing stages: ${deleteError.message}`);
      return;
    }

    // 2. Create new stages from template steps
    const newStages = templateSteps.map(step => ({
      program_id: programId,
      name: step.name,
      order: step.order_index,
    }));

    const { data, error: insertError } = await supabase
      .from('program_stages')
      .insert(newStages)
      .select();

    if (insertError) {
      showError(`Failed to apply template stages: ${insertError.message}`);
    } else {
      showSuccess("Workflow template applied successfully.");
      setStages(data || []); // Update the UI with the new stages
    }
  };

  return (
    <div className="container py-12">
      <Link to="/creator/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Programs
      </Link>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Manage Workflow</CardTitle>
          <CardDescription>
            Define the stages for your program: <span className="font-semibold">{program?.title}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {program?.workflow_template_id ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    <p className="font-semibold">This program is linked to a workflow template.</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/creator/workflow-templates/${program.workflow_template_id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Template
                    </Link>
                  </Button>
                </div>
                <p className="text-sm mt-2">The current program stages are listed below. To update them, apply the latest version of the template.</p>
              </div>
              
              <h3 className="text-lg font-medium">Template Steps (Read-only)</h3>
              {templateSteps.length > 0 ? (
                <ul className="space-y-2">
                  {templateSteps.map(step => (
                    <li key={step.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                      <span className="font-medium">{step.name}</span>
                      <Badge variant="outline" className="capitalize">{step.step_type}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">The linked template has no steps defined.</p>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full mt-4">Apply Template to Program</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will <span className="font-bold text-destructive">permanently delete all current stages</span> for this program and replace them with the stages from the linked template. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApplyTemplate}>Continue & Apply</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Current Stages</h3>
                {loading ? (
                  <p>Loading stages...</p>
                ) : stages.length > 0 ? (
                  <ul className="space-y-2">
                    {stages.map(stage => (
                      <li key={stage.id} className="flex items-center justify-between p-3 bg-secondary rounded-md">
                        <span className="font-medium">{stage.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStage(stage.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No stages defined yet. Add one to get started.</p>
                )}
              </div>
              <form onSubmit={handleAddStage} className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-medium">Add New Stage</h3>
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="e.g., Final Review"
                    value={newStageName}
                    onChange={e => setNewStageName(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button type="submit" disabled={isSubmitting || !newStageName.trim()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Stage
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageWorkflowPage;