import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { Textarea } from '../ui/textarea';

interface AddEvaluationSectionFormProps {
  onAddSection: (name: string, description: string | null) => Promise<void>;
}

export const AddEvaluationSectionForm = ({ onAddSection }: AddEvaluationSectionFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onAddSection(name, description || null);
    setName('');
    setDescription('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 pt-8 border-t">
      <h3 className="text-lg font-medium">Add New Section</h3>
      <div className="grid gap-2 mt-4">
        <Input
          placeholder="e.g., 'Core Competencies'"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={isSubmitting}
        />
        <Textarea
          placeholder="Optional description for the section"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full sm:w-auto self-end">
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>
    </form>
  );
};