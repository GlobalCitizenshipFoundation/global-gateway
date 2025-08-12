import ProgramCard from "@/components/ProgramCard";
import { Program } from "@/types";

const mockPrograms: Program[] = [
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

const Index = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Opportunities Portal
        </h1>
        <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
          Browse and apply for available grants, scholarships, and awards.
        </p>
      </header>
      <section>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {mockPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;