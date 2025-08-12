import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Program } from "@/types";

// Mock data - in a real app, this would come from an API
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

const ApplyPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const program = mockPrograms.find((p) => p.id === programId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for application submission
    console.log(`Application submitted for program: ${program?.title}`);
  };

  if (!program) {
    return (
      <div className="container text-center py-12">
        <h1 className="text-2xl font-bold">Program not found</h1>
        <p className="text-muted-foreground">
          The program you are trying to apply for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Apply for: {program.title}</CardTitle>
          <CardDescription>
            Please fill out the form below to submit your application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" placeholder="John Doe" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="statement">Personal Statement</Label>
                <Textarea
                  id="statement"
                  placeholder="Tell us about yourself and why you're a good fit for this opportunity..."
                  className="min-h-[150px]"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyPage;