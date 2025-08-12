export type Program = {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  status: 'Open' | 'Closed' | 'Reviewing';
};

export type Application = {
  id: string;
  programTitle: string;
  programId: string;
  status: 'Submitted' | 'In Review' | 'Accepted' | 'Rejected';
  submittedDate: Date;
};