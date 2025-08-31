CREATE TABLE public.scheduled_interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  campaign_phase_id UUID NOT NULL REFERENCES public.campaign_phases(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'booked', -- 'booked', 'canceled', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.scheduled_interviews ENABLE ROW LEVEL SECURITY;

-- Policy for applicants to view and manage their own interviews
CREATE POLICY "Applicants can view their own scheduled interviews" ON public.scheduled_interviews
FOR SELECT TO authenticated
USING (auth.uid() = applicant_id);

CREATE POLICY "Applicants can cancel their own scheduled interviews" ON public.scheduled_interviews
FOR UPDATE TO authenticated
USING (auth.uid() = applicant_id AND status = 'booked'); -- Only allow canceling if still booked

-- Policy for hosts to view and manage interviews they are hosting
CREATE POLICY "Hosts can view their assigned interviews" ON public.scheduled_interviews
FOR SELECT TO authenticated
USING (auth.uid() = host_id);

CREATE POLICY "Hosts can update status of their assigned interviews" ON public.scheduled_interviews
FOR UPDATE TO authenticated
USING (auth.uid() = host_id);

-- Policy for admins/campaign creators to view and manage all interviews
CREATE POLICY "Admins and campaign creators can manage all scheduled interviews" ON public.scheduled_interviews
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = scheduled_interviews.application_id AND creator_id = auth.uid()) -- Assuming application_id links to campaign
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = scheduled_interviews.application_id AND creator_id = auth.uid())
);