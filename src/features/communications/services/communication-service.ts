"use server";

import { createClient } from "@/integrations/supabase/server";

export interface CommunicationTemplate {
  id: string;
  creator_id: string;
  name: string;
  subject: string;
  body: string;
  type: 'email' | 'in-app' | 'sms';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getCommunicationTemplates(): Promise<CommunicationTemplate[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("communication_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching communication templates:", error.message);
    return null;
  }
  return data;
}

export async function getCommunicationTemplateById(id: string): Promise<CommunicationTemplate | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("communication_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching communication template ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function createCommunicationTemplate(
  name: string,
  subject: string,
  body: string,
  type: 'email' | 'in-app' | 'sms',
  is_public: boolean,
  creator_id: string
): Promise<CommunicationTemplate | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("communication_templates")
    .insert([{ name, subject, body, type, is_public, creator_id }])
    .select()
    .single();

  if (error) {
    console.error("Error creating communication template:", error.message);
    return null;
  }
  return data;
}

export async function updateCommunicationTemplate(
  id: string,
  updates: Partial<Omit<CommunicationTemplate, "id" | "creator_id" | "created_at">>
): Promise<CommunicationTemplate | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("communication_templates")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating communication template ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function deleteCommunicationTemplate(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("communication_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting communication template ${id}:`, error.message);
    return false;
  }
  return true;
}