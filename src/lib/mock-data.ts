import { Program, Application } from "@/types";

export const mockPrograms: Program[] = [
  {
    id: "1",
    title: "Innovators in Science Scholarship",
    description: "A scholarship for students pursuing a degree in STEM fields, demonstrating innovative thinking and academic excellence.",
    deadline: new Date("2024-12-31"),
    status: "Open",
  },
  {
    id: "2",
    title: "Future Leaders Grant",
    description: "Provides funding for community projects led by young leaders aged 18-25. Focus on social impact.",
    deadline: new Date("2024-11-15"),
    status: "Open",
  },
  {
    id: "3",
    title: "Art & Culture Award",
    description: "Recognizes outstanding contributions to the local arts scene. Open to artists of all mediums.",
    deadline: new Date("2024-09-30"),
    status: "Reviewing",
  },
  {
    id: "4",
    title: "Environmental Conservation Fund",
    description: "Supports projects aimed at protecting and preserving natural habitats and wildlife.",
    deadline: new Date("2024-08-01"),
    status: "Closed",
  },
];

export const mockApplications: Application[] = [
  {
    id: "app-01",
    programId: "1",
    programTitle: "Innovators in Science Scholarship",
    submittedDate: new Date("2024-07-15"),
    status: "In Review",
    submitterName: "Alice Johnson",
    submitterEmail: "alice@example.com",
  },
  {
    id: "app-02",
    programId: "1",
    programTitle: "Innovators in Science Scholarship",
    submittedDate: new Date("2024-07-18"),
    status: "Submitted",
    submitterName: "Bob Williams",
    submitterEmail: "bob@example.com",
  },
  {
    id: "app-03",
    programId: "3",
    programTitle: "Art & Culture Award",
    submittedDate: new Date("2024-06-20"),
    status: "Accepted",
    submitterName: "Charlie Brown",
    submitterEmail: "charlie@example.com",
  },
  {
    id: "app-04",
    programId: "4",
    programTitle: "Environmental Conservation Fund",
    submittedDate: new Date("2024-05-01"),
    status: "Rejected",
    submitterName: "Diana Prince",
    submitterEmail: "diana@example.com",
  },
    {
    id: "app-05",
    programId: "3",
    programTitle: "Art & Culture Award",
    submittedDate: new Date("2024-06-22"),
    status: "In Review",
    submitterName: "Eve Adams",
    submitterEmail: "eve@example.com",
  },
];