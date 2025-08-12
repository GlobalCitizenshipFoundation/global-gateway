export interface Program {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  status: 'Open' | 'Reviewing' | 'Closed';
}