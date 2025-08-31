"use server"; // Changed to server-only

import { createClient } from "@/integrations/supabase/server"; // Changed to server-side client
import { toast } from "sonner"; // Keep toast for client-side calls, but remove from server-only functions
import { Program } from "@/features/campaigns/services/campaign-service"; // Reusing Program interface from campaign-service

export const programService = {
  // Supabase client is now created on demand for server-side operations
  async getSupabase() {
    return await createClient();
  },

  async getPrograms(): Promise<Program[] | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching programs:", error.message);
      // toast.error("Failed to load programs."); // Cannot use toast in server-only service
      return null;
    }
    return data;
  },

  async getProgramById(id: string): Promise<Program | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching program ${id}:`, error.message);
      // toast.error(`Failed to load program ${id}.`); // Cannot use toast in server-only service
      return null;
    }
    return data;
  },

  async createProgram(
    name: string,
    description: string | null,
    start_date: string | null,
    end_date: string | null,
    status: Program['status'],
    creator_id: string
  ): Promise<Program | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("programs")
      .insert([{ name, description, start_date, end_date, status, creator_id }])
      .select()
      .single();

    if (error) {
      console.error("Error creating program:", error.message);
      // toast.error("Failed to create program."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Program created successfully!"); // Cannot use toast in server-only service
    return data;
  },

  async updateProgram(
    id: string,
    updates: Partial<Omit<Program, "id" | "creator_id" | "created_at">>
  ): Promise<Program | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("programs")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating program ${id}:`, error.message);
      // toast.error("Failed to update program."); // Cannot use toast in server-only service
      return null;
    }
    // toast.success("Program updated successfully!"); // Cannot use toast in server-only service
    return data;
  },

  async deleteProgram(id: string): Promise<boolean> {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from("programs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting program ${id}:`, error.message);
      // toast.error("Failed to delete program."); // Cannot use toast in server-only service
      return false;
    }
    // toast.success("Program deleted successfully!"); // Cannot use toast in server-only service
    return true;
  },
};