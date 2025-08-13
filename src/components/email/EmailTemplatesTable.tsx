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
import { EmailTemplate } from "@/types";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EmailTemplatesTableProps {
  emailTemplates: EmailTemplate[];
  onUpdateStatus: (templateId: string, newStatus: 'draft' | 'published') => void;
  onDelete: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
}

export const EmailTemplatesTable = ({ emailTemplates, onUpdateStatus, onDelete, onPreview }: EmailTemplatesTableProps) => {
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchUserNames = async () => {
      const uniqueUserIds = new Set<string>();
      emailTemplates.forEach(template => {
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
          console.error("Error fetching user names for email templates table:", error);
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
  }, [emailTemplates, userNames]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Template Name</TableHead>
          <TableHead className="hidden md:table-cell">Subject</TableHead>
          <TableHead className="hidden lg:table-cell">Type</TableHead>
          <TableHead className="hidden xl:table-cell">Status</TableHead>
          <TableHead className="hidden 2xl:table-cell">Last Modified</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {emailTemplates.length > 0 ? emailTemplates.map((template) => (
          <TableRow key={template.id} className={cn(template.is_default && "bg-blue-50/50 dark:bg-blue-950/20")}>
            <TableCell className="font-medium">{template.name}</TableCell>
            <TableCell className="hidden md:table-cell truncate max-w-[200px]">{template.subject}</TableCell>
            <TableCell className="hidden lg:table-cell">
              <Badge variant="outline">{template.is_default ? 'Default' : 'Custom'}</Badge>
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              <Badge variant={template.status === 'published' ? 'default' : 'secondary'}>
                {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="hidden 2xl:table-cell">
              {template.last_edited_at ? new Date(template.last_edited_at).toLocaleString() : new Date(template.created_at).toLocaleString()}
              {template.last_edited_by_user_id && (
                <div className="text-xs text-muted-foreground">
                  By: {userNames.get(template.last_edited_by_user_id) || 'Loading...'}
                </div>
              )}
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
                    <Link to={`/creator/emails/${template.id}/edit`}>Edit Template</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPreview(template)}>
                    Preview
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
                    disabled={template.is_default}
                  >
                    {template.is_default ? "Cannot Delete Default" : "Delete Template"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center h-24">
              You haven't created any email templates yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};