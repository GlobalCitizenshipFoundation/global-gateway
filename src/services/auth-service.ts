"use server"; // Changed to server-only

import { createClient } from "@/integrations/supabase/server"; // Changed to server-side client
import { toast } from "sonner"; // Keep toast for client-side calls, but remove from server-only functions

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
      // toast.error("Failed to sign out."); // Cannot use toast in server-only service
      throw error;
    }
    // toast.success("You have been signed out."); // Cannot use toast in server-only service
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