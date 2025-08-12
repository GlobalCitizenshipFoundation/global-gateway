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
  form_id: string | null; // New: Link to Form
};

export type Form = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_template: boolean;
  created_at: string;
  updated_at: string;
};

export type ProgramStage = {
  id: string;
  program_id: string;
  name: string;
  order: number;
  created_at: string;
};

export type Application = {
  id: string;
  submitted_date: string;
  program_id: string;
  user_id: string;
  stage_id: string;
  programs: {
    title: string;
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
  help_text: string | null;
  description: string | null;
  tooltip: string | null;
};