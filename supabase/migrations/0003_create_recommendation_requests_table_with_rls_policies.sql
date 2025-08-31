CREATE TABLE public.recommendation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  recommender_email TEXT NOT NULL,
  recommender_name TEXT,
  unique_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'viewed', 'submitted', 'overdue'
  request_sent_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  form_data JSONB, -- Stores the recommender's submission
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.recommendation_requests ENABLE ROW LEVEL SECURITY;

-- Policy for applicants to view their own requests
CREATE POLICY "Applicants can view their own recommendation requests" ON public.recommendation_requests
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.applications WHERE id = recommendation_requests.application_id AND applicant_id = auth.uid()));

-- Policy for recommenders to access their specific request via token (handled by server action)
-- RLS for this will be managed by the server action which uses the unique_token for access.
-- For direct database access, a policy like this could be used, but it's less secure for public access:
-- CREATE POLICY "Recommenders can view their request via token" ON public.recommendation_requests
-- FOR SELECT USING (request_token = current_setting('app.request_token', true)::text);

-- Policy for admins/campaign creators to view and manage all requests
CREATE POLICY "Admins and campaign creators can manage all recommendation requests" ON public.recommendation_requests
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = (SELECT campaign_id FROM public.applications WHERE id = recommendation_requests.application_id) AND creator_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = (SELECT campaign_id FROM public.applications WHERE id = recommendation_requests.application_id) AND creator_id = auth.uid())
);