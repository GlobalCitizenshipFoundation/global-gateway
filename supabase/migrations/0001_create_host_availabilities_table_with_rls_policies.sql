CREATE TABLE public.host_availabilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.host_availabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their own availabilities" ON public.host_availabilities
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Hosts can insert their own availabilities" ON public.host_availabilities
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hosts can update their own availabilities" ON public.host_availabilities
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Hosts can delete their own availabilities" ON public.host_availabilities
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admin override for full access
CREATE POLICY "Admins can manage all host availabilities" ON public.host_availabilities
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));