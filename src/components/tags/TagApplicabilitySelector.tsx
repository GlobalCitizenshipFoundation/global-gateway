import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { APPLICABLE_MODULES } from "@/constants/tags";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TagApplicabilitySelectorProps {
  value: string[]; // Array of selected module values (e.g., ['programs', 'forms'])
  onChange: (selectedModules: string[]) => void;
  disabled?: boolean;
}

export const TagApplicabilitySelector = ({ value, onChange, disabled }: TagApplicabilitySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelect = (moduleValue: string) => {
    const newValue = value.includes(moduleValue)
      ? value.filter((item) => item !== moduleValue)
      : [...value, moduleValue];
    onChange(newValue);
  };

  const displayValue = value.length > 0
    ? value.map((val: string) => APPLICABLE_MODULES.find((m: { value: string; label: string }) => m.value === val)?.label || val).join(", ")
    : "Select applicable modules...";

  const filteredModules = APPLICABLE_MODULES.filter((module: { value: string; label: string }) =>
    module.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <Tag className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <span className="flex-grow text-left truncate">
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {value.map((val: string) => (
                  <Badge key={val} variant="secondary" className="capitalize">
                    {APPLICABLE_MODULES.find((m: { value: string; label: string }) => m.value === val)?.label || val}
                  </Badge>
                ))}
              </div>
            ) : (
              "Select applicable modules..."
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Search modules..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No modules found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-48">
                {filteredModules.map((module: { value: string; label: string }) => (
                  <CommandItem
                    key={module.value}
                    value={module.label}
                    onSelect={() => handleSelect(module.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(module.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {module.label}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};