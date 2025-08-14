import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

import { useFormsData } from "@/hooks/forms/useFormsData";
import { useFormManagementActions } from "@/hooks/forms/useFormManagementActions";
import { FormsTable } from "@/components/forms/FormsTable";
import { DeleteFormDialog } from "@/components/forms/DeleteFormDialog";
import { CreateFormFromTemplateDialog } from "@/components/forms/CreateFormFromTemplateDialog";
import { SaveAsTemplateDialog } from "@/components/forms/SaveAsTemplateDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { Form as FormType, Tag as TagType } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTagsData } from "@/hooks/tags/useTagsData";
import { TagDisplay } from "@/components/tags/TagDisplay";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react"; // Explicit React import

const FormManagementPage = () => {
  const { forms, setForms, templates, setTemplates, loading, error } = useFormsData();
  const { tags: allAvailableTags, loading: loadingTags } = useTagsData();
  const {
    isDeleteDialogOpen, setIsDeleteDialogOpen, selectedForm, setSelectedForm, handleDeleteForm,
    isCreateFromTemplateDialogOpen, setIsCreateFromTemplateDialogOpen, selectedTemplateId, setSelectedTemplateId, newFormName, setNewFormName, isCreatingForm, handleCreateBlankForm, handleCreateFormFromTemplate,
    isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen, templateFormToCopy, setTemplateFormToCopy, newTemplateName, setNewTemplateName, isSavingTemplate, handleSaveAsTemplate,
    handleUpdateFormStatus,
  } = useFormManagementActions({ setForms, setTemplates, templates });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'form' | 'template'>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at'>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isTagFilterOpen, setIsTagFilterOpen] = useState<boolean>(false);

  const openCreateDialog = () => {
    setSelectedTemplateId(null);
    setNewFormName('');
    setIsCreateFromTemplateDialogOpen(true);
  };

  const handleTagFilterChange = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter((id: string) => id !== tagId) : [...prev, tagId]
    );
  };

  const filteredAndSortedForms = useMemo(() => {
    let filtered = forms.filter((form: FormType) => {
      const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' ||
                          (filterType === 'form' && !form.is_template) ||
                          (filterType === 'template' && form.is_template);
      
      const matchesTags = selectedTagIds.length === 0 ||
                          (form.tags && selectedTagIds.every((tagId: string) => form.tags?.some((formTag: TagType) => formTag.id === tagId)));

      return matchesSearch && matchesType && matchesTags;
    });

    filtered.sort((a: FormType, b: FormType) => {
      let compareA: any;
      let compareB: any;

      if (sortBy === 'name') {
        compareA = a.name.toLowerCase();
        compareB = b.name.toLowerCase();
      } else if (sortBy === 'created_at') {
        compareA = new Date(a.created_at).getTime();
        compareB = new Date(b.created_at).getTime();
      } else {
        compareA = new Date(a.last_edited_at || a.updated_at).getTime();
        compareB = new Date(b.last_edited_at || b.updated_at).getTime();
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [forms, searchTerm, filterType, selectedTagIds, sortBy, sortOrder]);

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
              {Array.from({ length: 3 }).map((_: any, i: number) => (
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
            <h1 className="text-3xl font-bold">Manage Forms</h1>
            <p className="text-muted-foreground">Oversee all forms and templates.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateBlankForm} disabled={isCreatingForm}>
              <Plus className="mr-2 h-4 w-4" /> Create Blank Form
            </Button>
            <Button variant="outline" onClick={openCreateDialog} disabled={templates.length === 0 || isCreatingForm}>
              Create from Template
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input
            placeholder="Search forms by name or description..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select value={filterType} onValueChange={(value: 'all' | 'form' | 'template') => setFilterType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="form">Forms</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
            </SelectContent>
          </Select>
          <Popover open={isTagFilterOpen} onOpenChange={setIsTagFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isTagFilterOpen}
                className="w-[180px] justify-between"
                disabled={loadingTags}
              >
                {selectedTagIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedTagIds.map((tagId: string) => {
                      const tag = allAvailableTags.find((t: TagType) => t.id === tagId);
                      return tag ? <TagDisplay key={tag.id} tag={tag} /> : null;
                    })}
                  </div>
                ) : (
                  "Filter by Tag"
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput
                  placeholder="Search tags..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-48">
                      {allAvailableTags.filter((tag: TagType) => tag.applicable_to.includes('forms')).map((tag: TagType) => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => handleTagFilterChange(tag.id)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <TagDisplay tag={tag} />
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Select value={sortBy} onValueChange={(value: 'name' | 'created_at' | 'updated_at') => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="updated_at">Last Modified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <FormsTable
              forms={filteredAndSortedForms}
              onUpdateStatus={handleUpdateFormStatus}
              onSaveAsTemplate={(form) => {
                setTemplateFormToCopy(form);
                setNewTemplateName(`${form.name} Template`);
                setIsSaveAsTemplateDialogOpen(true);
              }}
              onDelete={(form) => {
                setSelectedForm(form);
                setIsDeleteDialogOpen(true);
              }}
            />
          </CardContent>
        </Card>
      </div>

      <DeleteFormDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        formToDelete={selectedForm}
        onConfirmDelete={handleDeleteForm}
      />

      <CreateFormFromTemplateDialog
        isOpen={isCreateFromTemplateDialogOpen}
        onClose={() => setIsCreateFromTemplateDialogOpen(false)}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        newFormName={newFormName}
        setNewFormName={setNewFormName}
        isCreating={isCreatingForm}
        onCreate={handleCreateFormFromTemplate}
      />

      <SaveAsTemplateDialog
        isOpen={isSaveAsTemplateDialogOpen}
        onClose={() => setIsSaveAsTemplateDialogOpen(false)}
        formToCopy={templateFormToCopy}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        isSaving={isSavingTemplate}
        onSave={handleSaveAsTemplate}
      />
    </>
  );
};

export default FormManagementPage;