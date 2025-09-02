ALTER TABLE public.pathway_templates
ADD COLUMN application_open_date TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN participation_deadline TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN general_instructions TEXT NULL,
ADD COLUMN is_visible_to_applicants BOOLEAN NOT NULL DEFAULT TRUE;