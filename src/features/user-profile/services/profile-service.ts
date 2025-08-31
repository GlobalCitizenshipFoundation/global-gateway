"use server";

import { createClient } from "@/integrations/supabase/server";
import { Profile } from "@/types/supabase";

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await getSupabase();
  
  // Fetch profile data
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*") // Select all columns from profiles table
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error(`Error fetching profile for user ${userId}:`, profileError.message);
    throw new Error(`Failed to load profile: ${profileError.message}`);
  }

  // Fetch user's email from auth.users table
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError) {
    console.error(`Error fetching user email for user ${userId}:`, userError.message);
    // Don't throw an error here, as profile might still be valid even if email fetch fails
    // Or, handle it as a soft error, returning profile without email
    return { ...profileData, email: null } as Profile;
  }

  const flattenedProfile: Profile = {
    ...profileData,
    email: userData?.user?.email || null,
  };

  return flattenedProfile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, "id" | "created_at" | "email">>
): Promise<Profile | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*") // Select all columns from profiles table
    .single();

  if (error) {
    console.error(`Error updating profile for user ${userId}:`, error.message);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  // After updating, fetch the email again to return a complete Profile object
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError) {
    console.error(`Error fetching user email after update for user ${userId}:`, userError.message);
    return { ...data, email: null } as Profile;
  }

  const flattenedProfile: Profile = {
    ...data,
    email: userData?.user?.email || null,
  };

  return flattenedProfile;
}