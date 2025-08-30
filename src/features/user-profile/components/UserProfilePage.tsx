"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Profile } from "@/types/supabase";
import { getProfileByIdAction } from "../actions";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileBio } from "./ProfileBio";
import { ProfileTabs } from "./ProfileTabs";

interface UserProfilePageProps {
  initialProfile: Profile;
}

export function UserProfilePage({ initialProfile }: UserProfilePageProps) {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isLoading, setIsLoading] = useState(false); // Initial data is already loaded

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      if (user?.id) {
        const fetchedProfile = await getProfileByIdAction(user.id);
        if (fetchedProfile) {
          setProfile(fetchedProfile);
        } else {
          // getProfileByIdAction now redirects for not found/unauthorized,
          // so this else block might not be reached for those cases.
          // If it is reached, it implies a different kind of failure.
          toast.error("Failed to load profile data.");
          // No explicit router.push here, let the action's redirect handle it.
        }
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
      toast.error(error.message || "Failed to load profile.");
      // No explicit router.push here, let the action's redirect handle it.
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // If initialProfile is provided, use it. Otherwise, fetch.
    // This ensures Server Component data is used first, then client-side re-fetches if needed.
    if (!initialProfile && !isSessionLoading && user) {
      fetchProfile();
    }
  }, [initialProfile, isSessionLoading, user]);

  if (isSessionLoading || isLoading || !user) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const currentUser = user!;
  const userRole: string = currentUser.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';
  const canModifyProfile: boolean = currentUser.id === profile.id || isAdmin;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <h1 className="text-display-small font-bold text-foreground">My Profile</h1>

      <ProfileHeader profile={profile} canModify={canModifyProfile} onProfileUpdated={fetchProfile} />
      <ProfileBio profile={profile} canModify={canModifyProfile} onProfileUpdated={fetchProfile} />
      <ProfileTabs />
    </div>
  );
}