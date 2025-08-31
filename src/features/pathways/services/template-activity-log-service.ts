"use server";

import { createClient } from "@/integrations/supabase/server";

export interface TemplateActivityLog {
  id: string;
  template_id: string;
  user_id: string | null;
  event_type: string;
  description: string;
  details: Record<string, any> | null;
  created_at: string;
}

async function getSupabase() {
  return await createClient();
}

export async function logTemplateActivity(
  templateId: string,
  userId: string | null,
  eventType: string,
  description: string,
  details: Record<string, any> | null = null
): Promise<TemplateActivityLog | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("template_activity_log")
    .insert([{ template_id: templateId, user_id: userId, event_type: eventType, description, details }])
    .select()
    .single();

  if (error) {
    console.error("Error logging template activity:", error.message);
    return null;
  }
  return data;
}

export async function getTemplateActivityLogs(templateId: string): Promise<TemplateActivityLog[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("template_activity_log")
    .select("*, profiles(first_name, last_name, avatar_url)") // Join with profiles for user info
    .eq("template_id", templateId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching activity logs for template ${templateId}:`, error.message);
    return null;
  }
  return data as TemplateActivityLog[];
}