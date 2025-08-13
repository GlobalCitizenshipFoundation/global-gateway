export type Program = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: Date;
  created_at: string;
  status: 'draft' | 'published';
  submission_button_text: string | null;
  allow_pdf_download: boolean;
  updated_at: string;
  form_id: string | null; // Link to Form
  workflow_template_id: string | null; // Link to Workflow Template
};

export type Form = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_template: boolean;
  status: 'draft' | 'published'; // New: Status for the form itself
  created_at: string;
  updated_at: string;
  last_edited_by_user_id: string | null; // New
  last_edited_at: string | null; // New
};

export type ProgramStage = {
  id: string;
  program_id: string;
  name: string;
  order: number;
  created_at: string;
  // email_template_id: string | null; // Removed: Link to an email template
};

export type Application = {
  id: string;
  submitted_date: string;
  program_id: string;
  user_id: string;
  stage_id: string;
  programs: {
    title: string;
    allow_pdf_download: boolean; // Added for PDF download
    form_id: string | null; // Added form_id here
  } | null;
  program_stages: {
    name: string;
  } | null;
};

export type FormSection = {
  id: string;
  form_id: string; // Changed from program_id
  name: string;
  order: number;
  created_at: string;
  last_edited_by_user_id: string | null; // New
  last_edited_at: string | null; // New
  description: string | null; // New: Optional description for the section
  tooltip: string | null; // New: Optional tooltip for the section
};

export type DisplayRule = {
  field_id: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than' | 'is_before' | 'is_after' | 'contains_all_of' | 'contains_any_of' | 'contains_none_of';
  value: string | string[] | boolean | number | null;
  logic_type?: 'AND' | 'OR'; // For combining multiple rules
};

export type FormField = {
  id: string;
  form_id: string; // Changed from program_id
  section_id: string | null;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'email' | 'date' | 'phone' | 'number' | 'richtext' | 'rating';
  options: string[] | null;
  is_required: boolean;
  order: number;
  display_rules: DisplayRule[] | null;
  display_rules_logic_type: 'AND' | 'OR'; // New: Logic type for rules
  description: string | null;
  tooltip: string | null;
  placeholder: string | null; // New: Placeholder text for input fields
  last_edited_by_user_id: string | null; // New
  last_edited_at: string | null; // New
  // New date properties
  date_min: string | null; // ISO string for min date
  date_max: string | null; // ISO string for max date
  date_allow_past: boolean;
  date_allow_future: boolean;
  // New rating properties
  rating_min_value: number | null;
  rating_max_value: number | null;
  rating_min_label: string | null;
  rating_max_label: string | null;
};

export type Profile = {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  updated_at: string;
  role: 'applicant' | 'recommender' | 'reviewer' | 'lead_reviewer' | 'creator' | 'admin' | 'super_admin';
};

export type EmailTemplate = {
  id: string;
  user_id: string | null;
  name: string;
  subject: string;
  body: string; // HTML content
  is_default: boolean;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  last_edited_by_user_id: string | null;
  last_edited_at: string | null;
};

export type WorkflowTemplate = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  last_edited_by_user_id: string | null;
  last_edited_at: string | null;
};

export type WorkflowStage = {
  id: string;
  workflow_template_id: string;
  name: string;
  description: string | null;
  step_type: 'form' | 'screening' | 'review' | 'resubmission' | 'decision' | 'email' | 'scheduling' | 'status';
  order_index: number;
  created_at: string;
  updated_at: string;
  last_edited_by_user_id: string | null;
  last_edited_at: string | null;
  form_id: string | null;
  email_template_id: string | null;
};

export type ApplicationReview = {
  id: string;
  application_id: string;
  reviewer_id: string;
  score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type ApplicationAssignment = {
  id: string;
  application_id: string;
  reviewer_id: string;
  created_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  applications?: {
    id: string;
    full_name: string | null;
    submitted_date: string;
    program_id: string;
    programs: { title: string } | null;
    program_stages: { name: string } | null;
  } | null;
};