import { Profile } from "@/types/supabase";

export interface TemplateActivityLog {
  id: string;
  template_id: string;
  user_id: string | null;
  event_type: string;
  description: string;
  details: Record<string, any> | null;
  created_at: string;
  profiles?: Profile; // Joined profile data for the user who performed the action
}