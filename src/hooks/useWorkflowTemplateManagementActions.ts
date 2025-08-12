import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { WorkflowTemplate } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

interface UseWorkflowTemplateManagementActionsProps {
  setWorkflowTemplates: React.Dispatch<React.SetStateAction<WorkflowTemplate[]>>;
}

export const useWorkflowTemplateManagementActions = ({ setWorkflowTemplates }: UseWorkflowTemplateManagementActionsProps) => {
  const { user } = useSession();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleDeleteWorkflowTemplate = async () => {
    if (!selectedTemplate) return;

    const { error } = await supabase
      .from('workflow_templates')
      .delete()
      .eq('id', selectedTemplate.id);

    if (error) {
      showError(`Failed to delete workflow template: ${error.message}`);
    } else {
      showSuccess(`Workflow template "${selectedTemplate.name}" deleted successfully.`);
      setWorkflowTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
    }
    setSelectedTemplate(null);
    setIsDeleteDialogOpen(false);
  };

  const handleUpdateWorkflowTemplateStatus = async (templateId: string, newStatus: 'draft' | 'published') => {
    // Optimistic update
    setWorkflowTemplates(prev => prev.map(t => t.id === templateId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t));

    const { error } = await supabase
      .from('workflow_templates')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', templateId);

    if (error) {
      showError(`Failed to update template status: ${error.message}. Reverting.`);
      setWorkflowTemplates(prev => prev.map(t => t.id === templateId ? { ...t, status: newStatus === 'published' ? 'draft' : 'published' } : t)); // Simple revert
    } else {
      showSuccess(`Workflow template status updated to "${newStatus}".`);
    }
  };

  const handleCreateWorkflowTemplate = async () => {
    if (!user) {
      showError("You must be logged in to create a workflow template.");
      return;
    }
    if (!newTemplateName.trim()) {
      showError("Template name cannot be empty.");
      return;
    }
    setIsCreating(true);
    const now = new Date().toISOString();

    const { data, error } = await supabase.from("workflow_templates").insert({
      user_id: user.id,
      name: newTemplateName,
      status: 'draft',
      created_at: now,
      updated_at: now,
      last_edited_by_user_id: user.id,
      last_edited_at: now,
    }).select().single();

    if (error) {
      showError(`Failed to create template: ${error.message}`);
    } else if (data) {
      showSuccess("Workflow template created successfully!");
      setWorkflowTemplates(prev => [...prev, data]);
      setNewTemplateName('');
      setIsCreateDialogOpen(false);
    }
    setIsCreating(false);
  };

  return {
    isDeleteDialogOpen, setIsDeleteDialogOpen, selectedTemplate, setSelectedTemplate, handleDeleteWorkflowTemplate,
    isCreateDialogOpen, setIsCreateDialogOpen, newTemplateName, setNewTemplateName, isCreating, handleCreateWorkflowTemplate,
    handleUpdateWorkflowTemplateStatus,
  };
};