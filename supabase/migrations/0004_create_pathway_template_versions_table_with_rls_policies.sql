CREATE TABLE public.pathway_template_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pathway_template_id UUID NOT NULL REFERENCES public.pathway_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL, -- Full snapshot of the template and its phases' config
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (pathway_template_id, version_number)
);

ALTER TABLE public.pathway_template_versions ENABLE ROW LEVEL SECURITY;

-- Policy for admins and template creators to view versions
CREATE POLICY "Admins and template creators can view template versions" ON public.pathway_template_versions
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.pathway_templates WHERE id = pathway_template_versions.pathway_template_id AND creator_id = auth.uid())
);

-- Policy for admins and template creators to create versions
CREATE POLICY "Admins and template creators can create template versions" ON public.pathway_template_versions
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.pathway_templates WHERE id = pathway_template_versions.pathway_template_id AND creator_id = auth.uid())
);

-- Policy for admins and template creators to delete versions (e.g., for cleanup)
CREATE POLICY "Admins and template creators can delete template versions" ON public.pathway_template_versions
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.pathway_templates WHERE id = pathway_template_versions.pathway_template_id AND creator_id = auth.uid())
);