import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/integrations/supabase/server";
import { getProfileByIdAction } from "@/features/user-profile/actions";
import { UserProfilePage } from "@/features/user-profile/components/UserProfilePage";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const profile = await getProfileByIdAction(user.id);

  if (!profile) {
    // This case should ideally be handled by getProfileByIdAction's redirect,
    // but as a fallback, ensure we don't render without a profile.
    redirect("/error/404");
  }

  return (
    <UserProfilePage initialProfile={profile} />
  );
}