import { createClient } from "@/integrations/supabase/client";

export const authService = {
  supabase: createClient(),

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      throw error;
    }
  },

  async getUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error.message);
      return null;
    }
    return user;
  },

  async getSession() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error.message);
      return null;
    }
    return session;
  },
};