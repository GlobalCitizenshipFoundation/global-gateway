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
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
  value: string | string[] | boolean | number | null;
  logic_type?: 'AND' | 'OR'; // For combining multiple rules
};

export type FormField = {
  id: string;
  form_id: string; // Changed from program_id
  section_id: string | null;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'email' | 'date' | 'phone' | 'number' | 'richtext';
  options: string[] | null;
  is_required: boolean;
  order: number;
  display_rules: DisplayRule[] | null;
  description: string | null;
  tooltip: string | null;
  placeholder: string | null; // New: Placeholder text for input fields
  last_edited_by_user_id: string | null; // New
  last_edited_at: string | null; // New
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