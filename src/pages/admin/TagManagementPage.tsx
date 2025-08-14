import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { useTagsData } from "@/hooks/tags/useTagsData";
import { useTagManagementActions } from "@/hooks/tags/useTagManagementActions";
import { TagForm } from "@/components/tags/TagForm";
import { TagDisplay } from "@/components/tags/TagDisplay";
import { Tag } from "@/types";
import { APPLICABLE_MODULES } from "@/constants/tags";
import { Badge } from "@/components/ui/badge";

const TagManagementPage = () => {
  const { tags, loading, error, fetchTags } = useTagsData();
  const { isSubmitting, handleCreateTag, handleUpdateTag, handleDeleteTag } = useTagManagementActions({ fetchTags });

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const openCreateDialog = () => {
    setSelectedTag(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (values: { name: string; color: string; applicable_to: string[]; }) => {
    let success = false;
    if (selectedTag) {
      success = await handleUpdateTag(selectedTag.id, values);
    } else {
      const newTag = await handleCreateTag(values.name, values.color, values.applicable_to);
      success = !!newTag;
    }
    if (success) {
      setIsFormDialogOpen(false);
    }
  };

  const confirmDeleteTag = async () => {
    if (selectedTag) {
      await handleDeleteTag(selectedTag.id, selectedTag.name);
      setIsDeleteDialogOpen(false);
      setSelectedTag(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-9 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="container py-12 text-center text-destructive">Error: {error}</div>;
  }

  return (
    <>
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Tags</h1>
            <p className="text-muted-foreground">Create and manage tags for categorizing various entities in the system.</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" /> Create New Tag
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="hidden md:table-cell">Applicable To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.length > 0 ? tags.map((tag: Tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>
                      <TagDisplay tag={tag} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {tag.applicable_to.length > 0 ? (
                          tag.applicable_to.map((moduleValue: string) => (
                            <Badge key={moduleValue} variant="secondary" className="capitalize">
                              {APPLICABLE_MODULES.find((m: { value: string; label: string }) => m.value === moduleValue)?.label || moduleValue}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">None selected</span>
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
                          <DropdownMenuItem onClick={() => openEditDialog(tag)}>
                            Edit Tag
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openDeleteDialog(tag)}
                          >
                            Delete Tag
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No tags found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedTag ? "Edit Tag" : "Create New Tag"}</DialogTitle>
            <CardDescription>
              {selectedTag ? "Update the details for this tag." : "Define a new tag for categorization."}
            </CardDescription>
          </DialogHeader>
          <TagForm
            initialData={selectedTag || undefined}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            isNewTag={!selectedTag}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tag
              <span className="font-semibold"> "{selectedTag?.name}" </span>
              and remove it from all associated entities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTag} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TagManagementPage;