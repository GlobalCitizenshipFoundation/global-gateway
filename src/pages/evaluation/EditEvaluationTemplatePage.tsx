import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEvaluationTemplateBuilderData } from "@/hooks/evaluation/useEvaluationTemplateBuilderData";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const EditEvaluationTemplatePage = () => {
  const { template, setTemplate, criteria, setCriteria, loading, fetchData } = useEvaluationTemplateBuilderData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
    }
  }, [template]);

  if (loading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold">Template not found</h1>
        <p className="text-muted-foreground">The evaluation template you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Link to="/creator/evaluation-templates" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Templates
      </Link>
      
      <Card className="mx-auto max-w-3xl mb-8">
        <CardHeader>
          <CardTitle>Template Settings</CardTitle>
          <CardDescription>Define the name and description for this evaluation template.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template Name" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Template Description (optional)" />
        </CardContent>
      </Card>

      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Evaluation Criteria</CardTitle>
          <CardDescription>Add and arrange the criteria for this scorecard. Drag to reorder.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Criteria list will be implemented here.</p>
          <Button variant="outline" className="w-full mt-4">Add Criterion</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditEvaluationTemplatePage;