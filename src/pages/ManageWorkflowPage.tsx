import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { EmailTemplate, ProgramStage } from "@/types";
import { showError, showSuccess } from "@/utils/toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmailTemplatesData } from "@/hooks/useEmailTemplatesData"; // Import the hook

const ManageWorkflowPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const [stages, setStages] = useState<ProgramStage[]>([]);
  const [programTitle, setProgramTitle] = useState('');
  const [newStageName, setNewStageName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { emailTemplates, loading: templatesLoading, error: templatesError } = useEmailTemplatesData();

  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!programId) return;
      setLoading(true);

      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('title') // Optimized select
        .eq('id', programId)
        .single();

      if (programError || !programData) {
        showError("Could not fetch program details.");
        setLoading(false);
        return;
      }
      setProgramTitle(programData.title);

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
        email_template_id: null, // New stages start without a template
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

  const handleUpdateStageTemplate = async (stageId: string, templateId: string | null) => {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('program_stages')
      .update({ email_template_id: templateId })
      .eq('id', stageId);

    if (error) {
      showError(`Failed to update stage email template: ${error.message}`);
    } else {
      setStages(prevStages =>
        prevStages.map(stage =>
          stage.id === stageId ? { ...stage, email_template_id: templateId } : stage
        )
      );
      showSuccess("Stage email template updated successfully.");
    }
    setIsSubmitting(false);
  };

  const publishedEmailTemplates = emailTemplates.filter(t => t.status === 'published');

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
            Define the stages for your program: <span className="font-semibold">{programTitle}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Stages</h3>
            {loading || templatesLoading ? (
              <p>Loading stages and templates...</p>
            ) : templatesError ? (
              <p className="text-destructive">Error loading email templates: {templatesError}</p>
            ) : stages.length > 0 ? (
              <ul className="space-y-4">
                {stages.map(stage => (
                  <li key={stage.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-secondary rounded-md gap-2">
                    <span className="font-medium flex-grow">{stage.name}</span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Label htmlFor={`template-select-${stage.id}`} className="sr-only sm:not-sr-only">Email Template:</Label>
                      <Select
                        value={stage.email_template_id || ''}
                        onValueChange={(value) => handleUpdateStageTemplate(stage.id, value === '' ? null : value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id={`template-select-${stage.id}`} className="w-full sm:w-[200px]">
                          <SelectValue placeholder="No email template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No email template</SelectItem>
                          {publishedEmailTemplates.map(template => (
                            <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteStage(stage.id)} disabled={isSubmitting}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageWorkflowPage;