import { Program } from "@/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface ProgramCardProps {
  program: Program;
}

const ProgramCard = ({ program }: ProgramCardProps) => {
  const getStatusVariant = (status: Program['status']) => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'Closed':
        return 'destructive';
      case 'Reviewing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl mb-2">{program.title}</CardTitle>
          <Badge variant={getStatusVariant(program.status)} className="whitespace-nowrap">{program.status}</Badge>
        </div>
        <CardDescription>{program.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-2 h-4 w-4" />
          <span>Deadline: {program.deadline.toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={program.status !== 'Open'}>
          Apply Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProgramCard;