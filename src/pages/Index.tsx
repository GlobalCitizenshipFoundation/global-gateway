import { useState, useMemo, useEffect } from "react";
import ProgramCard from "@/components/ProgramCard";
import { Program } from "@/types";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        console.error("Error fetching programs:", error);
      } else if (data) {
        const formattedPrograms = data.map((p) => ({
          ...p,
          deadline: new Date(p.deadline),
        }));
        setPrograms(formattedPrograms as Program[]);
      }
      setLoading(false);
    };

    fetchPrograms();
  }, []);

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      return (
        program.title.toLowerCase().includes(lowerCaseSearch) ||
        (program.description &&
          program.description.toLowerCase().includes(lowerCaseSearch))
      );
    });
  }, [searchTerm, programs]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Opportunities Portal
        </h1>
        <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">
          Browse and apply for available grants, scholarships, and other award-based initiatives.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Input
          placeholder="Search by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
      </div>

      <section>
        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-destructive">
              Error Fetching Programs
            </h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
        ) : filteredPrograms.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold">No Programs Found</h2>
            <p className="text-muted-foreground mt-2">
              There are no programs available at the moment.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;