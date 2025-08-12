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
import { Program } from "@/types";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProgramsTableProps {
  programs: Program[];
  submissionCounts: Map<string, number>;
  onUpdateStatus: (programId: string, newStatus: 'draft' | 'published') => void;
  onDelete: (program: Program) => void;
  onOpenDeleteDialog: (program: Program) => void; // New prop for opening dialog
}

export const ProgramsTable = ({ programs, submissionCounts, onUpdateStatus, onDelete, onOpenDeleteDialog }: ProgramsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Program</TableHead>
          <TableHead className="text-center hidden md:table-cell">Submissions</TableHead>
          <TableHead className="hidden lg:table-cell">Status</TableHead>
          <TableHead className="hidden xl:table-cell">Created</TableHead>
          <TableHead className="hidden xl:table-cell">Last Modified</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {programs.length > 0 ? programs.map((program) => (
          <TableRow key={program.id}>
            <TableCell className="font-medium">{program.title}</TableCell>
            <TableCell className="text-center hidden md:table-cell">
              {submissionCounts.get(program.id) || 0}
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Badge variant={program.status === 'published' ? 'default' : 'secondary'}>
                {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              {new Date(program.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              {new Date(program.updated_at).toLocaleDateString()}
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
                    <Link to={`/creator/program/${program.id}/submissions`}>View Submissions</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/creator/program/${program.id}/pipeline`}>View Pipeline</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Configuration</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to={`/creator/program/${program.id}/edit`}>Edit Program</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/creator/program/${program.id}/workflow`}>Manage Workflow</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/creator/forms/${program.form_id}/edit`}>Manage Form</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  {program.status === 'draft' ? (
                    <DropdownMenuItem onClick={() => onUpdateStatus(program.id, 'published')}>
                      Publish
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onUpdateStatus(program.id, 'draft')}>
                      Unpublish (Set to Draft)
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onOpenDeleteDialog(program)}
                  >
                    Delete Program
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center h-24">
              You haven't created any programs yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};