"use server";

import { createClient } from "@/integrations/supabase/server";
import { TemplateActivityLog } from "./template-activity-log-types"; // Import the new type

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function createActivityLog(
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
    console.error("Error creating template activity log:", error.message);
    return null;
  }
  return data;
}

export async function getTemplateActivityLogs(templateId: string): Promise<TemplateActivityLog[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("template_activity_log")
    .select("*, profiles(first_name, last_name, avatar_url)") // Join with profiles to get user info
    .eq("template_id", templateId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching activity logs for template ${templateId}:`, error.message);
    return null;
  }
  return data;
}