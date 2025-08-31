"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Phone, Linkedin, Link as LinkIcon, UserCircle2 } from "lucide-react";
import { Profile } from "@/types/supabase";
import { ProfileForm } from "./ProfileForm"; // Reusing the ProfileForm for header editing

interface ProfileHeaderProps {
  profile: Profile;
  canModify: boolean;
  onProfileUpdated: () => void;
}

export function ProfileHeader({ profile, canModify, onProfileUpdated }: ProfileHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);

  const fullName = `${profile.first_name || ''} ${profile.middle_name ? profile.middle_name + ' ' : ''}${profile.last_name || ''}`.trim();

  const getUserInitials = (firstName: string | null, lastName: string | null) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

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
      <CardHeader className="p-0 mb-4 flex flex-row items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || ""} alt={fullName} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-display-small">
              {getUserInitials(profile.first_name, profile.last_name) || <UserCircle2 className="h-12 w-12" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-display-small font-bold text-foreground">
              {fullName || "Unnamed User"}
            </CardTitle>
            {profile.job_title && (
              <CardDescription className="text-headline-small text-muted-foreground">
                {profile.job_title}
              </CardDescription>
            )}
            {(profile.organization || profile.location) && (
              <p className="text-title-medium text-muted-foreground mt-1">
                {profile.organization && <span>{profile.organization}</span>}
                {profile.organization && profile.location && <span>, </span>}
                {profile.location && <span>{profile.location}</span>}
              </p>
            )}
          </div>
        </div>
        {canModify && (
          <Button variant="outline" size="icon" className="rounded-md" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit Profile Header</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0 text-body-medium text-foreground space-y-2">
        <h3 className="text-title-medium font-bold text-foreground mt-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {profile.email && ( // Display actual email
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${profile.email}`} className="text-primary hover:underline">
                {profile.email}
              </a>
            </div>
          )}
          {profile.phone_number && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${profile.phone_number}`} className="text-primary hover:underline">
                {profile.phone_number}
              </a>
            </div>
          )}
          {profile.linkedin_url && (
            <div className="flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-muted-foreground" />
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                LinkedIn
              </a>
            </div>
          )}
          {profile.orcid_url && (
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a href={profile.orcid_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                ORCiD
              </a>
            </div>
          )}
          {profile.website_url && (
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Website
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}