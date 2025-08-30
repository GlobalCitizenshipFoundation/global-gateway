import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/integrations/supabase/server";
import { getProfileByIdAction } from "@/features/user-profile/actions";
import { UserProfilePage } from "@/features/user-profile/components/UserProfilePage";

export default async function ProfilePage() {
  // The middleware.ts should have already ensured the user is authenticated.
  // We fetch the user here to get their ID for the profile action.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is null here, it means middleware failed or was bypassed.
  // The getProfileByIdAction will handle redirects if the profile isn't found or unauthorized.
  const profile = await getProfileByIdAction(user!.id); // user should be present due to middleware

  // The getProfileByIdAction already handles redirects for not found/unauthorized profiles.
  // If it returns null, it means a redirect has already occurred.
  // This component should only render if a profile is successfully fetched.
  if (!profile) {
    // This case should ideally not be reached if getProfileByIdAction handles redirects.
    // As a final fallback, if for some reason profile is null here, redirect to a generic error.
    redirect("/error/500"); 
  }

  return (
    <UserProfilePage initialProfile={profile} />
  );
}