export type Program = {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  status: 'Open' | 'Closed' | 'Reviewing';
};