"use server";

import { createClient } from "@/integrations/supabase/server";
import { Profile } from "@/types/supabase";
// import { toast } from "sonner"; // Removed client-side import

export const profileService = {
  // Supabase client is now created on demand for server-side operations
  async getSupabase() {
    return await createClient();
  },

  async getProfileById(userId: string): Promise<Profile | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("*, auth.users(email)")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(`Error fetching profile for user ${userId}:`, error.message);
      throw new Error(`Failed to load profile: ${error.message}`);
    }

    const profileData = data as unknown as Profile & { users: { email: string | null } };
    const flattenedProfile: Profile = {
      ...profileData,
      email: profileData.users?.email || null,
    };

    return flattenedProfile;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, "id" | "created_at" | "email">>
  ): Promise<Profile | null> {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("*, auth.users(email)")
      .single();

    if (error) {
      console.error(`Error updating profile for user ${userId}:`, error.message);
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    const profileData = data as unknown as Profile & { users: { email: string | null } };
    const flattenedProfile: Profile = {
      ...profileData,
      email: profileData.users?.email || null,
    };

    return flattenedProfile;
  },
};