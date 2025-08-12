import ProgramCard from "@/components/ProgramCard";
import { mockPrograms } from "../data/mockData";

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