import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Tag as TagIcon } from "lucide-react"; // Renamed Tag to TagIcon to avoid conflict
import { cn } from "@/lib/utils";
import { Tag as TagType } from "@/types"; // Correctly import Tag as TagType
import { TagDisplay } from "@/components/tags/TagDisplay";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface FormTagsInputProps {
  formId: string | undefined;
  currentTags: string[]; // Array of tag IDs currently associated with the form
  allAvailableTags: TagType[]; // All tags the user can select from
  onTagsChange: (selectedTagIds: string[]) => void;
  loading: boolean;
}

export const FormTagsInput = ({
  formId,
  currentTags,
  allAvailableTags,
  onTagsChange,
  loading,
}: FormTagsInputProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelectTag = (tagId: string) => {
    const newValue = currentTags.includes(tagId)
      ? currentTags.filter((item) => item !== tagId)
      : [...currentTags, tagId];
    onTagsChange(newValue);
  };

  const filteredTags = allAvailableTags.filter((tag: TagType) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid gap-2">
        <Label>Form Tags</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label>Form Tags</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 py-2"
          >
            <TagIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="flex-grow text-left truncate">
              {currentTags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {currentTags.map((tagId: string) => {
                    const tag = allAvailableTags.find(t => t.id === tagId);
                    return tag ? <TagDisplay key={tag.id} tag={tag} /> : null;
                  })}
                </div>
              ) : (
                "Select tags..."
              )}
            </span>
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
                  {filteredTags.map((tag: TagType) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelectTag(tag.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentTags.includes(tag.id) ? "opacity-100" : "opacity-0"
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
    </div>
  );
};