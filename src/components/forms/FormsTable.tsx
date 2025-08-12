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
import { Form as FormType } from "@/types";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Import cn for conditional styling
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FormsTableProps {
  forms: FormType[];
  onUpdateStatus: (formId: string, newStatus: 'draft' | 'published') => void;
  onSaveAsTemplate: (form: FormType) => void;
  onDelete: (form: FormType) => void;
}

export const FormsTable = ({ forms, onUpdateStatus, onSaveAsTemplate, onDelete }: FormsTableProps) => {
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchUserNames = async () => {
      const uniqueUserIds = new Set<string>();
      forms.forEach(form => {
        if (form.last_edited_by_user_id && !userNames.has(form.last_edited_by_user_id)) {
          uniqueUserIds.add(form.last_edited_by_user_id);
        }
      });

      if (uniqueUserIds.size > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name') // Fetch first and last name
          .in('id', Array.from(uniqueUserIds));

        if (error) {
          console.error("Error fetching user names for forms table:", error);
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
  }, [forms, userNames]); // Depend on forms and userNames to re-fetch if new users appear

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Form Name</TableHead>
          <TableHead className="md:table-cell">Type</TableHead> {/* Removed hidden */}
          <TableHead className="lg:table-cell">Publication Status</TableHead> {/* Removed hidden */}
          <TableHead className="xl:table-cell">Form Updated Date</TableHead> {/* Removed hidden */}
          <TableHead className="xl:table-cell">Created Date</TableHead> {/* Removed hidden */}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {forms.length > 0 ? forms.map((form) => (
          <TableRow key={form.id} className={cn(form.is_template && "bg-blue-50/50 dark:bg-blue-950/20")}>
            <TableCell className="font-medium">{form.name}</TableCell>
            <TableCell className="md:table-cell">
              <Badge variant="outline">{form.is_template ? 'Template' : 'Program Form'}</Badge>
            </TableCell>
            <TableCell className="lg:table-cell">
              <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="xl:table-cell">
              {form.last_edited_at ? new Date(form.last_edited_at).toLocaleString() : new Date(form.updated_at).toLocaleString()}
              {form.last_edited_by_user_id && (
                <div className="text-xs text-muted-foreground">
                  By: {userNames.get(form.last_edited_by_user_id) || 'Loading...'}
                </div>
              )}
            </TableCell>
            <TableCell className="xl:table-cell">
              {new Date(form.created_at).toLocaleDateString()}
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
                    <Link to={`/creator/forms/${form.id}/edit`}>Edit Form</Link>
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
            <TableCell colSpan={6} className="text-center h-24">
              You haven't created any forms or templates yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};