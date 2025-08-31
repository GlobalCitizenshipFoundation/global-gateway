"use server";

import { createClient } from "@/integrations/supabase/server";
// import { toast } from "sonner"; // Removed client-side import

export const authService = {
  // Supabase client is now created on demand for server-side operations
  async getSupabase() {
    return await createClient();
  },

  async signOut(): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      throw error;
    }
  },

  async getUser(): Promise<any | null> { // Using any for user type for now, can be refined later
    const supabase = await this.getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error.message);
      return null;
    }
    return user;
  },

  async getSession(): Promise<any | null> { // Using any for session type for now, can be refined later
    const supabase = await this.getSupabase();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error.message);
      return null;
    }
    return session;
  },
};