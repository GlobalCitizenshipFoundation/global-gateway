export type Program = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: Date;
  created_at: string;
  status: 'draft' | 'published'; // New: Program status
  submission_button_text: string | null; // New: Custom text for submission button
  allow_pdf_download: boolean; // New: Option to allow PDF download of submission
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
  program_id: string;
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
  program_id: string;
  section_id: string | null; // New: Link to FormSection
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'email' | 'date' | 'phone' | 'number' | 'richtext';
  options: string[] | null;
  is_required: boolean;
  order: number;
  display_rules: DisplayRule[] | null; // New: Conditional display logic
  help_text: string | null; // New: Additional guidance for the field
  description: string | null; // New: Description for the field
  tooltip: string | null; // New: Tooltip for the field
};