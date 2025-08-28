import { createClient } from "@/integrations/supabase/client";

export const authService = {
  supabase: createClient(),

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      throw error;
    }
  },

  async getUser(): Promise<any | null> { // Using any for user type for now, can be refined later
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error.message);
      return null;
    }
    return user;
  },

  async getSession(): Promise<any | null> { // Using any for session type for now, can be refined later
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error.message);
      return null;
    }
    return session;
  },
};