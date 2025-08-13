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
import { WorkflowTemplate } from "@/types";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkflowTemplatesTableProps {
  templates: WorkflowTemplate[];
  onUpdateStatus: (templateId: string, newStatus: 'draft' | 'published') => void;
  onDelete: (template: WorkflowTemplate) => void;
}

export const WorkflowTemplatesTable = ({ templates, onUpdateStatus, onDelete }: WorkflowTemplatesTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Last Modified</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.length > 0 ? templates.map((template) => (
          <TableRow key={template.id}>
            <TableCell className="font-medium">
              <Link to={`/creator/workflows/${template.id}/edit`} className="hover:underline">
                {template.name}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={template.status === 'published' ? 'default' : 'secondary'}>
                {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {new Date(template.last_edited_at || template.updated_at).toLocaleString()}
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
                    <Link to={`/creator/workflows/${template.id}/edit`}>Edit Template</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {template.status === 'draft' ? (
                    <DropdownMenuItem onClick={() => onUpdateStatus(template.id, 'published')}>
                      Publish
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onUpdateStatus(template.id, 'draft')}>
                      Unpublish
                    </DropdownMenuItem>
                  )}
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
              No workflow templates found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};