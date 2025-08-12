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
    fullName: "Alice Johnson",
    email: "alice@example.com",
    personalStatement: "My passion for astrophysics began with a childhood gift: a small telescope. Since then, I have dedicated my academic career to understanding the cosmos, culminating in my research on exoplanetary atmospheres. This scholarship would allow me to continue my work and contribute to our understanding of the universe."
  },
  {
    id: "app-02",
    programId: "1",
    programTitle: "Innovators in Science Scholarship",
    submittedDate: new Date("2024-07-18"),
    status: "Submitted",
    fullName: "Bob Williams",
    email: "bob@example.com",
    personalStatement: "I believe that biotechnology holds the key to solving some of the world's most pressing problems, from disease to food scarcity. My project focuses on developing drought-resistant crops using CRISPR technology, and I am confident that with the support of the Innovators in Science Scholarship, I can make a significant impact."
  },
  {
    id: "app-03",
    programId: "3",
    programTitle: "Art & Culture Award",
    submittedDate: new Date("2024-06-20"),
    status: "Accepted",
    fullName: "Charlie Brown",
    email: "charlie@example.com",
    personalStatement: "Through my sculptures, I explore the intersection of nature and urban environments. I use reclaimed materials to create pieces that challenge viewers to reconsider their relationship with the world around them. The Art & Culture Award would provide me with the resources to create a large-scale public installation."
  },
  {
    id: "app-04",
    programId: "4",
    programTitle: "Environmental Conservation Fund",
    submittedDate: new Date("2024-05-01"),
    status: "Rejected",
    fullName: "Diana Prince",
    email: "diana@example.com",
    personalStatement: "For generations, my community has been the steward of the Amazon rainforest. My project aims to combine traditional indigenous knowledge with modern conservation techniques to protect this vital ecosystem from deforestation. I am seeking the Environmental Conservation Fund's support to empower local communities and preserve our shared natural heritage."
  },
    {
    id: "app-05",
    programId: "3",
    programTitle: "Art & Culture Award",
    submittedDate: new Date("2024-06-22"),
    status: "In Review",
    fullName: "Eve Adams",
    email: "eve@example.com",
    personalStatement: "My medium is digital art, and I use it to tell stories that are often overlooked. My latest series focuses on the experiences of first-generation immigrants, using augmented reality to bring their narratives to life. I am applying for the Art & Culture Award to expand this project and share these important stories with a wider audience."
  },
];