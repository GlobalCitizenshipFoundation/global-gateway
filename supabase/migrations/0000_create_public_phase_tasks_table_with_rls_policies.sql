-- Create phase_tasks table
CREATE TABLE public.phase_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to_role TEXT, -- e.g., 'applicant', 'reviewer', 'admin'
  assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed'
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (phase_id, order_index)
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.phase_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view tasks if they can view the parent phase
CREATE POLICY "phase_tasks_select_policy" ON public.phase_tasks
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.phases WHERE phases.id = phase_tasks.phase_id AND EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND (pathway_templates.creator_id = auth.uid() OR pathway_templates.is_private = FALSE))));

-- Policy: Allow only creator of parent template or admin to insert tasks
CREATE POLICY "phase_tasks_insert_policy" ON public.phase_tasks
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.phases WHERE phases.id = phase_tasks.phase_id AND EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND (pathway_templates.creator_id = auth.uid() OR is_admin()))));

-- Policy: Allow creator of parent template, admin, or assigned user to update tasks
CREATE POLICY "phase_tasks_update_policy" ON public.phase_tasks
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.phases WHERE phases.id = phase_tasks.phase_id AND EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND (pathway_templates.creator_id = auth.uid() OR is_admin()))))
WITH CHECK ((auth.uid() = assigned_to_user_id) OR EXISTS (SELECT 1 FROM public.phases WHERE phases.id = phase_tasks.phase_id AND EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND (pathway_templates.creator_id = auth.uid() OR is_admin()))));

-- Policy: Allow only creator of parent template or admin to delete tasks
CREATE POLICY "phase_tasks_delete_policy" ON public.phase_tasks
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.phases WHERE phases.id = phase_tasks.phase_id AND EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND (pathway_templates.creator_id = auth.uid() OR is_admin()))));