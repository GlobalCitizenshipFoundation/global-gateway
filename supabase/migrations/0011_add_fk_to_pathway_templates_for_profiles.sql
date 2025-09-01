-- Add foreign key constraint for creator_id
ALTER TABLE public.pathway_templates
ADD CONSTRAINT pathway_templates_creator_id_fkey
FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for last_updated_by
-- Using ON DELETE SET NULL as last_updated_by is nullable,
-- which is safer than CASCADE for historical data if a user is deleted.
ALTER TABLE public.pathway_templates
ADD CONSTRAINT pathway_templates_last_updated_by_fkey
FOREIGN KEY (last_updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;