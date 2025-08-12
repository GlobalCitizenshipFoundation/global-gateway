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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WorkflowTemplatesTableProps {
  workflowTemplates: WorkflowTemplate[];
  onUpdateStatus: (templateId: string, newStatus: 'draft' | 'published') => void;
  onDelete: (template: WorkflowTemplate) => void;
}

export const WorkflowTemplatesTable = ({ workflowTemplates, onUpdateStatus, onDelete }: WorkflowTemplatesTableProps) => {
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchUserNames = async () => {
      const uniqueUserIds = new Set<string>();
      workflowTemplates.forEach(template => {
        if (template.last_edited_by_user_id && !userNames.has(template.last_edited_by_user_id)) {
          uniqueUserIds.add(template.last_edited_by_user_id);
        }
      });

      if (uniqueUserIds.size > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', Array.from(uniqueUserIds));

        if (error) {
          console.error("Error fetching user names for workflow templates table:", error);
        } else if (data) {
          const newNames = new Map(userNames);
          data.forEach(profile => {
            const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
            newNames.set(profile.id, fullName || 'Unknown User');
          });
          setUserNames(newNames);
        }
      }
    };
    fetchUserNames();
  }, [workflowTemplates, userNames]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead className="lg:table-cell">Publication Status</TableHead>
          <TableHead className="xl:table-cell">Last Modified</TableHead>
          <TableHead className="xl:table-cell">Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workflowTemplates.length > 0 ? workflowTemplates.map((template) => (
          <TableRow key={template.id}>
            <TableCell className="font-medium">
              <Link to={`/creator/workflow-templates/${template.id}/edit`} className="hover:underline">
                {template.name}
              </Link>
            </TableCell>
            <TableCell className="lg:table-cell">
              <Badge variant={template.status === 'published' ? 'default' : 'secondary'}>
                {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="xl:table-cell">
              {template.last_edited_at ? new Date(template.last_edited_at).toLocaleString() : new Date(template.updated_at).toLocaleString()}
              {template.last_edited_by_user_id && (
                <div className="text-xs text-muted-foreground">
                  By: {userNames.get(template.last_edited_by_user_id) || 'Loading...'}
                </div>
              )}
            </TableCell>
            <TableCell className="xl:table-cell">
              {new Date(template.created_at).toLocaleDateString()}
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
                    <Link to={`/creator/workflow-templates/${template.id}/edit`}>Edit Template</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  {template.status === 'draft' ? (
                    <DropdownMenuItem onClick={() => onUpdateStatus(template.id, 'published')}>
                      Publish
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onUpdateStatus(template.id, 'draft')}>
                      Unpublish (Set to Draft)
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
            <TableCell colSpan={5} className="text-center h-24">
              You haven't created any workflow templates yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};