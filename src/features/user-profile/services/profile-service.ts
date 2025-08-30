import { createClient } from "@/integrations/supabase/server"; // Changed to server client
import { Profile } from "@/types/supabase";

export const profileService = {
  supabase: createClient(),

  async getProfileById(userId: string): Promise<Profile | null> {
    const supabase = await this.supabase; // Await the client creation
    // Fetch profile data and join with auth.users to get the email
    const { data, error } = await supabase
      .from("profiles")
      .select("*, auth.users(email)") // Select all profile fields and the email from auth.users
      .eq("id", userId)
      .single();

    if (error) {
      console.error(`Error fetching profile for user ${userId}:`, error.message);
      // Do not toast here, throw error for action to handle
      throw new Error(`Failed to load profile: ${error.message}`);
    }

    // Supabase returns joined data nested, so we need to flatten it
    const profileData = data as unknown as Profile & { users: { email: string | null } };
    const flattenedProfile: Profile = {
      ...profileData,
      email: profileData.users?.email || null, // Extract email from nested users object
    };

    return flattenedProfile;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, "id" | "created_at" | "email">> // Exclude email from direct updates to profiles table
  ): Promise<Profile | null> {
    const supabase = await this.supabase; // Await the client creation
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("*, auth.users(email)") // Re-select with email for consistent return type
      .single();

    if (error) {
      console.error(`Error updating profile for user ${userId}:`, error.message);
      // Do not toast here, throw error for action to handle
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