-- Add tags column to pathway_templates
ALTER TABLE public.pathway_templates
ADD COLUMN tags TEXT[] DEFAULT '{}'::TEXT[];

-- Update RLS policies to allow creator and admin to update the new tags column
-- Existing UPDATE policy: "Allow authenticated users to update their own pathway templates"
-- This policy already allows the creator to update their own template.
-- For admins, the Server Action authorization will handle the override.
-- No explicit change needed for the RLS policy itself, as 'UPDATE' command covers all columns.