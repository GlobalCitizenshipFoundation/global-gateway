"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, X } from "lucide-react";
import { Profile } from "@/types/supabase";
import { ProfileForm } from "./ProfileForm"; // Reusing the ProfileForm for bio editing

interface ProfileBioProps {
  profile: Profile;
  canModify: boolean;
  onProfileUpdated: () => void;
}

export function ProfileBio({ profile, canModify, onProfileUpdated }: ProfileBioProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <ProfileForm
        initialData={profile}
        onProfileUpdated={() => {
          onProfileUpdated();
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-headline-small font-bold text-foreground">Professional Bio</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            A summary of your expertise and professional identity.
          </CardDescription>
        </div>
        {canModify && (
          <Button variant="outlined" size="icon" className="rounded-md" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit Bio</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0 text-body-large text-foreground whitespace-pre-wrap">
        {profile.bio || (
          <p className="text-muted-foreground italic">
            {canModify ? "Add a professional summary to your profile." : "No professional summary provided."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}