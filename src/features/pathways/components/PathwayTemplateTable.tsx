"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  RotateCcw,
  Tag,
  UserCircle2,
  CalendarDays,
  Globe,
  Lock,
} from "lucide-react";
import { PathwayTemplate } from "@/types/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { publishPathwayTemplateAction, updatePathwayTemplateStatusAction } from "../actions";
import { CloneTemplateDialog } from "./CloneTemplateDialog";

interface PathwayTemplateTableProps {
  templates: PathwayTemplate[];
  user: any;
  isAdmin: boolean;
  handleClone: (template: PathwayTemplate) => void;
  handleDelete: (id: string) => void;
  fetchTemplates: () => void;
}

type ColumnKey = "name" | "description" | "createdBy" | "lastUpdatedBy" | "status" | "tags" | "actions";

const defaultVisibleColumns: Record<ColumnKey, boolean> = {
  name: true,
  description: true,
  createdBy: true,
  lastUpdatedBy: true,
  status: true,
  tags: true,
  actions: true,
};

export function PathwayTemplateTable({
  templates,
  user,
  isAdmin,
  handleClone,
  handleDelete,
  fetchTemplates,
}: PathwayTemplateTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(defaultVisibleColumns);
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [templateToClone, setTemplateToClone] = useState<PathwayTemplate | null>(null);

  const toggleColumnVisibility = (key: ColumnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getProfileDisplayName = (profile: any) => {
    if (!profile) return "Unknown User";
    return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Unknown User";
  };

  const getStatusBadge = (status: PathwayTemplate['status']) => {
    switch (status) {
      case 'draft': return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
      case 'published': return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Published</Badge>;
      case 'archived': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Archive className="h-3 w-3 mr-1" /> Archived</Badge>;
      default: return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100">Unknown</Badge>;
    }
  };

  const handlePublishTemplate = async (templateId: string) => {
    try {
      const publishedVersion = await publishPathwayTemplateAction(templateId);
      if (publishedVersion) {
        toast.success(`Template published and new version ${publishedVersion.version_number} created!`);
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to publish template.");
    }
  };

  const handleUpdateStatus = async (templateId: string, newStatus: PathwayTemplate['status']) => {
    try {
      const updatedTemplate = await updatePathwayTemplateStatusAction(templateId, newStatus);
      if (updatedTemplate) {
        toast.success(`Template status updated to ${newStatus}!`);
        fetchTemplates();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update template status.");
    }
  };

  const handleCloneClick = (template: PathwayTemplate) => {
    setTemplateToClone(template);
    setIsCloneDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto rounded-md">
              <MoreHorizontal className="mr-2 h-4 w-4" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <DropdownMenuLabel className="text-body-medium">Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            {Object.keys(defaultVisibleColumns).map((key) => (
              <DropdownMenuCheckboxItem
                key={key}
                className="capitalize text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer"
                checked={visibleColumns[key as ColumnKey]}
                onCheckedChange={() => toggleColumnVisibility(key as ColumnKey)}
              >
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-xl border overflow-hidden shadow-md">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {visibleColumns.name && <TableHead className="text-label-large font-semibold text-foreground">Template Name</TableHead>}
              {visibleColumns.description && <TableHead className="text-label-large font-semibold text-foreground">Description</TableHead>}
              {visibleColumns.createdBy && <TableHead className="text-label-large font-semibold text-foreground">Created By</TableHead>}
              {visibleColumns.lastUpdatedBy && <TableHead className="text-label-large font-semibold text-foreground">Last Updated By</TableHead>}
              {visibleColumns.status && <TableHead className="text-label-large font-semibold text-foreground">Status</TableHead>}
              {visibleColumns.tags && <TableHead className="text-label-large font-semibold text-foreground">Tags</TableHead>}
              {visibleColumns.actions && <TableHead className="text-label-large font-semibold text-foreground text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="h-24 text-center text-body-medium text-muted-foreground">
                  No templates found.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => {
                const canEditOrDelete = user && (template.creator_id === user.id || isAdmin);
                return (
                  <TableRow key={template.id} className="hover:bg-muted/30 transition-colors">
                    {visibleColumns.name && (
                      <TableCell className="font-medium text-body-medium text-foreground">
                        <Link href={`/pathways/${template.id}`} className="text-primary hover:underline flex items-center gap-2">
                          {template.name}
                          <TooltipProvider>
                            {template.is_private ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                                  Private Template
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Globe className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                                  Public Template
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TooltipProvider>
                        </Link>
                      </TableCell>
                    )}
                    {visibleColumns.description && (
                      <TableCell className="text-body-medium text-muted-foreground max-w-xs truncate">
                        {template.description || "N/A"}
                      </TableCell>
                    )}
                    {visibleColumns.createdBy && (
                      <TableCell className="text-body-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <UserCircle2 className="h-4 w-4" />
                          {getProfileDisplayName(template.creator_profile)}
                        </div>
                        <div className="flex items-center gap-1 text-body-small">
                          <CalendarDays className="h-4 w-4" />
                          {format(new Date(template.created_at), "PPP")}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.lastUpdatedBy && (
                      <TableCell className="text-body-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <UserCircle2 className="h-4 w-4" />
                          {getProfileDisplayName(template.last_updater_profile)}
                        </div>
                        <div className="flex items-center gap-1 text-body-small">
                          <CalendarDays className="h-4 w-4" />
                          {format(new Date(template.updated_at), "PPP")}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell className="text-body-medium">
                        {getStatusBadge(template.status)}
                      </TableCell>
                    )}
                    {visibleColumns.tags && (
                      <TableCell className="text-body-medium">
                        {template.tags && template.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {template.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-label-small bg-muted text-muted-foreground">
                                <Tag className="h-3 w-3 mr-1" /> {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.actions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                            <DropdownMenuLabel className="text-body-medium">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem asChild className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                              <Link href={`/pathways/${template.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            {canEditOrDelete && (
                              <>
                                <DropdownMenuItem asChild className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                  <Link href={`/pathways/${template.id}`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit Template
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCloneClick(template)} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                  <Copy className="mr-2 h-4 w-4" /> Clone Template
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                {template.status !== 'published' ? (
                                  <DropdownMenuItem onClick={() => handlePublishTemplate(template.id)} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                    <CheckCircle className="mr-2 h-4 w-4" /> Publish Template
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(template.id, 'draft')} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                    <RotateCcw className="mr-2 h-4 w-4" /> Unpublish (Set to Draft)
                                  </DropdownMenuItem>
                                )}
                                {template.status !== 'archived' ? (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(template.id, 'archived')} className="text-body-medium text-destructive hover:bg-destructive-container hover:text-destructive cursor-pointer">
                                    <Archive className="mr-2 h-4 w-4" /> Archive Template
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(template.id, 'draft')} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                    <RotateCcw className="mr-2 h-4 w-4" /> Unarchive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="bg-border" />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-body-medium text-destructive hover:bg-destructive-container hover:text-destructive cursor-pointer">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-headline-small">Confirm Permanent Deletion</AlertDialogTitle>
                                      <AlertDialogDescription className="text-body-medium text-muted-foreground">
                                        Are you sure you want to permanently delete the &quot;{template.name}&quot; pathway template? This action cannot be undone and will remove all associated phases and data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(template.id)}
                                        className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete Permanently
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {templateToClone && (
        <CloneTemplateDialog
          isOpen={isCloneDialogOpen}
          onClose={() => { setIsCloneDialogOpen(false); setTemplateToClone(null); fetchTemplates(); }}
          templateId={templateToClone.id}
          originalTemplateName={templateToClone.name}
        />
      )}
    </div>
  );
}