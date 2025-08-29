// This file defines common TypeScript interfaces for Supabase tables,
// especially for joined data, to ensure type safety across the application.

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

// You can add more interfaces here as needed for other Supabase tables.