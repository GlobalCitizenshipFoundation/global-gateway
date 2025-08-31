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
  email: string | null; // Added email field
}

export interface PathwayTemplate {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  last_updated_by: string | null;
  // New fields for template-level essential information
  application_open_date: string | null; // ISO date string
  participation_deadline: string | null; // ISO date string
  general_instructions: string | null; // Rich text content
  is_visible_to_applicants: boolean; // New field
}

// New base interface for configurable items (phases)
export interface BaseConfigurableItem {
  id: string;
  name: string;
  type: string; // e.g., 'Form', 'Review', 'Email', 'Scheduling', 'Decision', 'Recommendation'
  description: string | null;
  order_index: number;
  config: Record<string, any>; // JSONB field for phase-specific configuration
  created_at: string;
  updated_at: string;
  last_updated_by: string | null;
  // New phase-level fields
  phase_start_date: string | null;
  phase_end_date: string | null;
  applicant_instructions: string | null;
  manager_instructions: string | null;
  is_visible_to_applicants: boolean;
}

// Phase now extends BaseConfigurableItem
export interface Phase extends BaseConfigurableItem {
  pathway_template_id: string;
}

// Define PhaseTask here as well for central typing
export interface PhaseTask {
  id: string;
  phase_id: string;
  name: string;
  description: string | null;
  assigned_to_role: string | null;
  assigned_to_user_id: string | null;
  due_date: string | null;
  status: 'pending' | 'completed';
  order_index: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Joined profile data for the assigned user
}

// You can add more interfaces here as needed for other Supabase tables.