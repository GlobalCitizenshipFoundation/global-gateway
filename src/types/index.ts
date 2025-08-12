export type Program = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: Date;
  created_at: string;
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

export type FormField = {
  id: string;
  program_id: string;
  label: string;
  field_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'email' | 'date';
  options: string[] | null;
  is_required: boolean;
  order: number;
};