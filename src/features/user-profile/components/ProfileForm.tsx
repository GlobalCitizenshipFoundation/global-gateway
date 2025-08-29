"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile } from "@/types/supabase";
import { updateProfileDetailsAction } from "../actions";

const profileFormSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1, { message: "First name is required." }).max(50, { message: "First name cannot exceed 50 characters." }),
  middle_name: z.string().max(50, { message: "Middle name cannot exceed 50 characters." }).nullable().optional(),
  last_name: z.string().min(1, { message: "Last name is required." }).max(50, { message: "Last name cannot exceed 50 characters." }),
  job_title: z.string().max(100, { message: "Job title cannot exceed 100 characters." }).nullable().optional(),
  organization: z.string().max(100, { message: "Organization cannot exceed 100 characters." }).nullable().optional(),
  location: z.string().max(100, { message: "Location cannot exceed 100 characters." }).nullable().optional(),
  phone_number: z.string().max(20, { message: "Phone number cannot exceed 20 characters." }).nullable().optional(),
  linkedin_url: z.string().url({ message: "Invalid LinkedIn URL." }).nullable().optional().or(z.literal('')),
  orcid_url: z.string().url({ message: "Invalid ORCiD URL." }).nullable().optional().or(z.literal('')),
  website_url: z.string().url({ message: "Invalid Website URL." }).nullable().optional().or(z.literal('')),
  bio: z.string().max(1000, { message: "Bio cannot exceed 1000 characters." }).nullable().optional(),
  avatar_url: z.string().url({ message: "Invalid Avatar URL." }).nullable().optional().or(z.literal('')),
});

interface ProfileFormProps {
  initialData: Profile;
  onProfileUpdated: () => void;
  onCancel: () => void;
}

export function ProfileForm({ initialData, onProfileUpdated, onCancel }: ProfileFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      id: initialData.id,
      first_name: initialData.first_name || "",
      middle_name: initialData.middle_name || "",
      last_name: initialData.last_name || "",
      job_title: initialData.job_title || "",
      organization: initialData.organization || "",
      location: initialData.location || "",
      phone_number: initialData.phone_number || "",
      linkedin_url: initialData.linkedin_url || "",
      orcid_url: initialData.orcid_url || "",
      website_url: initialData.website_url || "",
      bio: initialData.bio || "",
      avatar_url: initialData.avatar_url || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      const result = await updateProfileDetailsAction(formData);
      if (result) {
        toast.success("Profile updated successfully!");
        onProfileUpdated();
      }
    } catch (error: any) {
      console.error("Profile form submission error:", error);
      toast.error(error.message || "Failed to update profile.");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto rounded-xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-headline-medium text-primary">Edit Profile</CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Update your personal and professional details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} className="rounded-md" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middle_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Middle Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="A." {...field} className="rounded-md" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} className="rounded-md" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="job_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Job Title / Tagline</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} className="rounded-md" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="Global Citizenship Foundation" {...field} className="rounded-md" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Location (City, State, Country)</FormLabel>
                    <FormControl>
                      <Input placeholder="New York, NY, USA" {...field} className="rounded-md" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} className="rounded-md" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <h3 className="text-title-large font-bold text-foreground mt-8">Online Presence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">LinkedIn Profile URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/yourprofile" {...field} className="rounded-md" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orcid_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">ORCiD / Researcher Profile URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://orcid.org/0000-0000-0000-0000" {...field} className="rounded-md" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Personal Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourwebsite.com" {...field} className="rounded-md" value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Professional Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short summary of your expertise and professional identity."
                      className="resize-y min-h-[100px] rounded-md"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    Share a brief overview of your professional background and interests.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-label-large">Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/your-avatar.jpg" {...field} className="rounded-md" value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription className="text-body-small">
                    Link to your profile picture.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outlined" onClick={onCancel} className="rounded-md text-label-large">
                Cancel
              </Button>
              <Button type="submit" className="rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}