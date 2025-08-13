import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EvaluationTemplate } from "@/types";
import { MoreHorizontal } from "lucide-react";

interface EvaluationTemplatesTableProps {
  templates: EvaluationTemplate[];
  onDelete: (template: EvaluationTemplate) => void;
}

export const EvaluationTemplatesTable = ({ templates, onDelete }: EvaluationTemplatesTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead className="hidden md:table-cell">Last Modified</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.length > 0 ? templates.map((template) => (
          <TableRow key={template.id}>
            <TableCell className="font-medium">
              <Link to={`/creator/evaluation-templates/${template.id}/edit`} className="hover:underline">
                {template.name}
              </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell truncate max-w-xs">{template.description}</TableCell>
            <TableCell className="hidden md:table-cell">
              {new Date(template.updated_at).toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to={`/creator/evaluation-templates/${template.id}/edit`}>Edit Template</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(template)}
                  >
                    Delete Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center h-24">
              No evaluation templates found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};