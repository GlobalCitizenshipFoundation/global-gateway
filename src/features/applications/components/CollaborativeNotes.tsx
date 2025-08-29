"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle2, Edit, Trash2, Send } from "lucide-react";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getApplicationNotesAction,
  createApplicationNoteAction,
  updateApplicationNoteAction,
  deleteApplicationNoteAction,
} from "../actions";
import { ApplicationNote } from "../services/application-service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const noteFormSchema = z.object({
  content: z.string().min(1, "Note cannot be empty.").max(1000, "Note cannot exceed 1000 characters."),
});

interface CollaborativeNotesProps {
  applicationId: string;
  canAddNotes: boolean; // Only campaign creator/admin can add notes
  onNotesUpdated: () => void; // Callback to refresh parent data if needed
}

export function CollaborativeNotes({
  applicationId,
  canAddNotes,
  onNotesUpdated,
}: CollaborativeNotesProps) {
  const { user, isLoading: isSessionLoading } = useSession();
  const [notes, setNotes] = useState<ApplicationNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const fetchedNotes = await getApplicationNotesAction(applicationId);
      if (fetchedNotes) {
        setNotes(fetchedNotes);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load notes.");
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchNotes();
    }
  }, [user, isSessionLoading, applicationId]);

  const onSubmit = async (values: z.infer<typeof noteFormSchema>) => {
    if (!canAddNotes) {
      toast.error("You do not have permission to add notes.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("content", values.content);

      let result: ApplicationNote | null;
      if (editingNoteId) {
        result = await updateApplicationNoteAction(editingNoteId, formData);
      } else {
        result = await createApplicationNoteAction(applicationId, formData);
      }

      if (result) {
        form.reset();
        setEditingNoteId(null);
        fetchNotes();
        onNotesUpdated();
      }
    } catch (error: any) {
      console.error("Note submission error:", error);
      toast.error(error.message || "Failed to save note.");
    }
  };

  const handleEdit = (note: ApplicationNote) => {
    setEditingNoteId(note.id);
    form.setValue("content", note.content);
  };

  const handleDelete = async (noteId: string) => {
    try {
      const success = await deleteApplicationNoteAction(noteId);
      if (success) {
        fetchNotes();
        onNotesUpdated();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete note.");
    }
  };

  const getUserInitials = (firstName: string | undefined, lastName: string | undefined) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const currentUserIsAdmin = user?.user_metadata?.role === 'admin';

  return (
    <Card className="rounded-xl shadow-lg p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small font-bold text-foreground">Collaborative Notes</CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Team discussions and private comments for this application.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {isLoadingNotes ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {notes.length === 0 ? (
              <p className="text-body-medium text-muted-foreground text-center">No notes yet. Be the first to add one!</p>
            ) : (
              notes.map((note) => {
                const isAuthor = user?.id === note.author_id;
                const canModifyNote = isAuthor || currentUserIsAdmin;
                const authorName = `${note.profiles?.first_name || ''} ${note.profiles?.last_name || ''}`.trim() || "Unknown User";

                return (
                  <div key={note.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border border-border">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={note.profiles?.avatar_url || ""} alt={authorName} />
                      <AvatarFallback className="bg-primary-container text-on-primary-container text-label-small">
                        {getUserInitials(note.profiles?.first_name, note.profiles?.last_name) || <UserCircle2 className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-label-large font-medium text-foreground">
                          {authorName}
                          {isAuthor && <span className="ml-2 text-body-small text-muted-foreground">(You)</span>}
                        </p>
                        <span className="text-body-small text-muted-foreground">
                          {new Date(note.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-body-medium text-foreground break-words whitespace-pre-wrap">{note.content}</p>
                      {note.created_at !== note.updated_at && (
                        <p className="text-body-small text-muted-foreground mt-1">
                          (Edited: {new Date(note.updated_at).toLocaleString()})
                        </p>
                      )}
                      {canModifyNote && (
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => handleEdit(note)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Note</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete Note</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-headline-small">Confirm Deletion</AlertDialogTitle>
                                <AlertDialogDescription className="text-body-medium text-muted-foreground">
                                  Are you sure you want to delete this note? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(note.id)}
                                  className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {canAddNotes && (
          <div className="mt-6 pt-6 border-t border-border">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-label-large">Add a new note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your note here..."
                          className="resize-y min-h-[80px] rounded-md"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : (editingNoteId ? "Update Note" : "Add Note")}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}