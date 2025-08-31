-- Add is_deleted column to pathway_templates table
ALTER TABLE public.pathway_templates
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL;

-- Update RLS policies for pathway_templates to exclude soft-deleted entries
-- Recreate SELECT policy
DROP POLICY IF EXISTS "Allow authenticated users to view their own or public pathway templates" ON public.pathway_templates;
CREATE POLICY "Allow authenticated users to view their own or public pathway templates"
ON public.pathway_templates FOR SELECT TO authenticated
USING ( (auth.uid() = creator_id) OR (is_private = FALSE) AND (is_deleted = FALSE) );

-- Recreate UPDATE policy
DROP POLICY IF EXISTS "Allow authenticated users to update their own pathway templates" ON public.pathway_templates;
CREATE POLICY "Allow authenticated users to update their own pathway templates"
ON public.pathway_templates FOR UPDATE TO authenticated
USING ( (auth.uid() = creator_id) AND (is_deleted = FALSE) );

-- Recreate DELETE policy (for soft delete, actual hard delete is admin_only)
DROP POLICY IF EXISTS "Allow authenticated users to delete their own pathway templates" ON public.pathway_templates;
CREATE POLICY "Allow authenticated users to delete their own pathway templates"
ON public.pathway_templates FOR DELETE TO authenticated
USING ( (auth.uid() = creator_id) AND (is_deleted = FALSE) );


-- Add is_deleted column to phases table
ALTER TABLE public.phases
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL;

-- Update RLS policies for phases to exclude soft-deleted entries
-- Recreate SELECT policy
DROP POLICY IF EXISTS "Allow authenticated users to view phases of their own or public templates" ON public.phases;
CREATE POLICY "Allow authenticated users to view phases of their own or public templates"
ON public.phases FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND (pathway_templates.creator_id = auth.uid() OR pathway_templates.is_private = FALSE) AND (pathway_templates.is_deleted = FALSE)) AND (is_deleted = FALSE));

-- Recreate UPDATE policy
DROP POLICY IF EXISTS "Allow authenticated users to update phases of their own templates" ON public.phases;
CREATE POLICY "Allow authenticated users to update phases of their own templates"
ON public.phases FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND pathway_templates.creator_id = auth.uid()) AND (is_deleted = FALSE));

-- Recreate DELETE policy (for soft delete, actual hard delete is admin_only)
DROP POLICY IF EXISTS "Allow authenticated users to delete phases of their own templates" ON public.phases;
CREATE POLICY "Allow authenticated users to delete phases of their own templates"
ON public.phases FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND pathway_templates.creator_id = auth.uid()) AND (is_deleted = FALSE));

-- Recreate INSERT policy (no change needed for is_deleted, as it defaults to FALSE)
DROP POLICY IF EXISTS "Allow authenticated users to create phases for their own templates" ON public.phases;
CREATE POLICY "Allow authenticated users to create phases for their own templates"
ON public.phases FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = phases.pathway_template_id AND pathway_templates.creator_id = auth.uid()));