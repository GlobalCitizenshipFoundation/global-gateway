export type Program = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  deadline: Date;
  status: 'Open' | 'Closed' | 'Reviewing';
  created_at: string;
};