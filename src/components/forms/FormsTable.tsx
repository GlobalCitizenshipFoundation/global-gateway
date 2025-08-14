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
import { Form as FormType, Tag as TagType } from "@/types"; // Import TagType
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TagDisplay } from "@/components/tags/TagDisplay";
import React from "react"; // Explicit React import

interface FormsTableProps {
  forms: FormType[];
  onUpdateStatus: (formId: string, newStatus: 'draft' | 'published') => void;
  onSaveAsTemplate: (form: FormType) => void;
  onDelete: (form: FormType) => void;
}

export const FormsTable = ({ forms, onUpdateStatus, onSaveAsTemplate, onDelete }: FormsTableProps) => {
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchUserNames = async (): Promise<void> => {
      const uniqueUserIds = new Set<string>();
      forms.forEach((form: FormType) => {
        if (form.user_id && !userNames.has(form.user_id)) {
          uniqueUserIds.add(form.user_id);
        }
        if (form.last_edited_by_user_id && !userNames.has(form.last_edited_by_user_id)) {
          uniqueUserIds.add(form.last_edited_by_user_id);
        }
      });

      if (uniqueUserIds.size > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', Array.from(uniqueUserIds));

        if (error) {
          console.error("Error fetching user names for forms table:", error);
        } else if (data) {
          const newNames = new Map(userNames);
          data.forEach((profile: any) => {
            const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
            newNames.set(profile.id, fullName || 'Unknown User');
          });
          setUserNames(newNames);
        }
      }
    };
    if (forms.length > 0) {
      fetchUserNames();
    }
  }, [forms, userNames]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Form Name</TableHead>
          <TableHead className="hidden md:table-cell">Type</TableHead>
          <TableHead className="hidden lg:table-cell">Publishing Status</TableHead>
          <TableHead className="hidden xl:table-cell">Created</TableHead>
          <TableHead className="hidden 2xl:table-cell">Last Updated</TableHead>
          <TableHead className="hidden 2xl:table-cell">Tags</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {forms.length > 0 ? forms.map((form: FormType) => (
          <TableRow key={form.id} className={cn(form.is_template && "bg-blue-50/50 dark:bg-blue-950/20")}>
            <TableCell className="font-medium">
              <Link to={`/creator/forms/${form.id}/edit`} className="hover:underline">
                {form.name}
              </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="outline">{form.is_template ? 'Template' : 'Form'}</Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              {new Date(form.created_at).toLocaleDateString()}
              {form.user_id && (
                <div className="text-xs text-muted-foreground">
                  By: {userNames.get(form.user_id) || 'Loading...'}
                </div>
              )}
            </TableCell>
            <TableCell className="hidden 2xl:table-cell">
              {form.last_edited_at ? new Date(form.last_edited_at).toLocaleString() : new Date(form.updated_at).toLocaleString()}
              {form.last_edited_by_user_id && (
                <div className="text-xs text-muted-foreground">
                  By: {userNames.get(form.last_edited_by_user_id) || 'Loading...'}
                </div>
              )}
            </TableCell>
            <TableCell className="hidden 2xl:table-cell">
              <div className="flex flex-wrap gap-1">
                {form.tags && form.tags.length > 0 ? (
                  form.tags.map((tag: TagType) => (
                    <TagDisplay key={tag.id} tag={tag} />
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">No tags</span>
                )}
              </div>
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
                    <Link to={`/creator/forms/${form.id}/edit`}>
                      {form.is_template ? 'Edit Template' : 'Edit Form'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  {form.status === 'draft' ? (
                    <DropdownMenuItem onClick={() => onUpdateStatus(form.id, 'published')}>
                      Publish
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onUpdateStatus(form.id, 'draft')}>
                      Unpublish (Set to Draft)
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {!form.is_template && (
                    <DropdownMenuItem onClick={() => onSaveAsTemplate(form)}>
                      Save as Template
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(form)}
                  >
                    Delete Form
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center h-24">
              You haven't created any forms or templates yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};