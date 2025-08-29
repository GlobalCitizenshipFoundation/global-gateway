"use client";

import { createClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile } from "@/types/supabase";

export const profileService = {
  supabase: createClient(),

  async getProfileById(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(`Error fetching profile for user ${userId}:`, error.message);
      // Do not show toast here, let the action handle user-friendly error messages/redirections
      return null;
    }
    return data as Profile;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Omit<Profile, "id" | "created_at">>
  ): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      console.error(`Error updating profile for user ${userId}:`, error.message);
      // Do not show toast here, let the action handle user-friendly error messages
      return null;
    }
    return data as Profile;
  },
};