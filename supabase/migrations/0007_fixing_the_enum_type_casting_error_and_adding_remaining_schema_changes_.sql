-- Add status column to public.pathway_templates
-- First, add as TEXT without a default to avoid casting issues
ALTER TABLE public.pathway_templates
ADD COLUMN status TEXT;

-- Update existing rows to a default value compatible with the ENUM
UPDATE public.pathway_templates
SET status = 'draft'
WHERE status IS NULL;

-- Set the column as NOT NULL
ALTER TABLE public.pathway_templates
ALTER COLUMN status SET NOT NULL;

-- Create ENUM type for pathway_templates.status
DO $$ BEGIN
    CREATE TYPE public.pathway_template_status AS ENUM ('draft', 'pending_review', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Alter column to use the new ENUM type, explicitly casting existing data
ALTER TABLE public.pathway_templates
ALTER COLUMN status TYPE public.pathway_template_status USING status::public.pathway_template_status;

-- Set the default value for the ENUM type
ALTER TABLE public.pathway_templates
ALTER COLUMN status SET DEFAULT 'draft'::public.pathway_template_status;

-- Add last_updated_by column to public.pathway_templates
ALTER TABLE public.pathway_templates
ADD COLUMN last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add last_updated_by column to public.phases
ALTER TABLE public.phases
ADD COLUMN last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create public.template_activity_log table
CREATE TABLE public.template_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.pathway_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for template_activity_log
ALTER TABLE public.template_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for template_activity_log
CREATE POLICY "Allow authenticated users to view their own template activity" ON public.template_activity_log
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.pathway_templates WHERE pathway_templates.id = template_activity_log.template_id AND pathway_templates.creator_id = auth.uid()));

CREATE POLICY "Admins can view all template activity" ON public.template_activity_log
FOR SELECT TO authenticated
USING (is_admin());