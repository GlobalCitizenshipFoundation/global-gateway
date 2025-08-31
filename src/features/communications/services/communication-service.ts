"use server"; // Changed to server-only

import { createClient } from "@/integrations/supabase/server"; // Changed to server-side client
import { toast } from "sonner"; // Keep toast for client-side calls, but remove from server-only functions

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

export const communicationService = {
  // Supabase client is now created on demand for server-side operations
  async getSupabase() {
    return await createClient();
  },

  async getCommunicationTemplates(): Promise<CommunicationTemplate[] | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("communication_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching communication templates:", error.message);
      // toast.error("Failed to load communication templates."); // Cannot use toast in server-only service
      return null;
    }
    return data;
  },

  async getCommunicationTemplateById(id: string): Promise<CommunicationTemplate | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("communication_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching communication template ${id}:`, error.message);
      // toast.error(`Failed to load communication template ${id}.`); // Cannot use toast in server-only service
      return null;
    }
    return data;
  },

  async createCommunicationTemplate(
    name: string,
    subject: string,
    body: string,
    type: 'email' | 'in-app' | 'sms',
    is_public: boolean,
    creator_id: string
  ): Promise<CommunicationTemplate | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("communication_templates")
      .insert([{ name, subject, body, type, is_public, creator_id }])
      .select()
      .single();

    if (error) {
      console.error("Error creating communication template:", error.message);
      // toast.error("Failed to create communication template."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Communication template created successfully!"); // Cannot use toast in server-only service
    return data;
  },

  async updateCommunicationTemplate(
    id: string,
    updates: Partial<Omit<CommunicationTemplate, "id" | "creator_id" | "created_at">>
  ): Promise<CommunicationTemplate | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("communication_templates")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating communication template ${id}:`, error.message);
      // toast.error("Failed to update communication template."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Communication template updated successfully!"); // Cannot use toast in server-only service
    return data;
  },

  async deleteCommunicationTemplate(id: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("communication_templates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting communication template ${id}:`, error.message);
      // toast.error("Failed to delete communication template."); // Cannot use toast in server-only service
      return false;
    }
    // toast.success("Communication template deleted successfully!"); // Cannot use toast in server-only service
    return true;
  },
};