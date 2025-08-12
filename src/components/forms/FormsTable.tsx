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

interface FormsTableProps {
  forms: FormType[];
  onUpdateStatus: (formId: string, newStatus: 'draft' | 'published') => void;
  onSaveAsTemplate: (form: FormType) => void;
  onDelete: (form: FormType) => void;
}

export const FormsTable = ({ forms, onUpdateStatus, onSaveAsTemplate, onDelete }: FormsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Form Name</TableHead>
          <TableHead className="hidden md:table-cell">Type</TableHead>
          <TableHead className="hidden lg:table-cell">Status</TableHead>
          <TableHead className="hidden xl:table-cell">Created</TableHead>
          <TableHead className="hidden xl:table-cell">Last Modified</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {forms.length > 0 ? forms.map((form) => (
          <TableRow key={form.id}>
            <TableCell className="font-medium">{form.name}</TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="outline">{form.is_template ? 'Template' : 'Program Form'}</Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              {new Date(form.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              {new Date(form.updated_at).toLocaleDateString()}
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