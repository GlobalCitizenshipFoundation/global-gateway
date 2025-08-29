"use server";

import { profileService } from "./services/profile-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Profile } from "@/types/supabase";

// Helper function to check user authorization for a profile
async function authorizeProfileAccess(profileId: string, action: 'read' | 'write'): Promise<{ user: any; profile: Profile | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let profile: Profile | null = null;
  if (profileId) {
    profile = await profileService.getProfileById(profileId);
    if (!profile) {
      throw new Error("ProfileNotFound");
    }
  }

  if (action === 'read') {
    if (!isAdmin && user.id !== profileId) {
      throw new Error("UnauthorizedAccessToProfile");
    }
  } else if (action === 'write') {
    if (!isAdmin && user.id !== profileId) {
      throw new Error("UnauthorizedToModifyProfile");
    }
  }

  return { user, profile, isAdmin };
}

export async function getProfileByIdAction(userId: string): Promise<Profile | null> {
  try {
    const { profile } = await authorizeProfileAccess(userId, 'read');
    return profile;
  } catch (error: any) {
    console.error("Error in getProfileByIdAction:", error.message);
    if (error.message === "UnauthorizedAccessToProfile") {
      redirect("/error/403");
    } else if (error.message === "ProfileNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveProfile") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function updateProfileDetailsAction(formData: FormData): Promise<Profile | null> {
  const userId = formData.get("id") as string;
  if (!userId) {
    throw new Error("User ID is required for profile update.");
  }

  try {
    await authorizeProfileAccess(userId, 'write');

    const updates: Partial<Profile> = {
      first_name: formData.get("first_name") as string,
      middle_name: formData.get("middle_name") as string || null,
      last_name: formData.get("last_name") as string,
      job_title: formData.get("job_title") as string || null,
      organization: formData.get("organization") as string || null,
      location: formData.get("location") as string || null,
      phone_number: formData.get("phone_number") as string || null,
      linkedin_url: formData.get("linkedin_url") as string || null,
      orcid_url: formData.get("orcid_url") as string || null,
      website_url: formData.get("website_url") as string || null,
      bio: formData.get("bio") as string || null,
      avatar_url: formData.get("avatar_url") as string || null, // Allow updating avatar URL
    };

    const updatedProfile = await profileService.updateProfile(userId, updates);

    revalidatePath("/portal/profile");
    return updatedProfile;
  } catch (error: any) {
    console.error("Error in updateProfileDetailsAction:", error.message);
    if (error.message === "UnauthorizedToModifyProfile") {
      redirect("/error/403");
    } else if (error.message === "ProfileNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveProfile") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}