// This file defines common TypeScript interfaces for Supabase tables,
// especially for joined data, to ensure type safety across the application.

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  job_title: string | null;
  organization: string | null;
  location: string | null;
  phone_number: string | null;
  linkedin_url: string | null;
  orcid_url: string | null;
  website_url: string | null;
  bio: string | null;
}

// You can add more interfaces here as needed for other Supabase tables.