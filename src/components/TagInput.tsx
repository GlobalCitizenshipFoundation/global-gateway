"use client";

import * as React from "react";
import { X, Tag as TagIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TagInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ value = [], onChange, disabled, className, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const newTag = inputValue.trim();
        if (newTag && !value.includes(newTag)) {
          onChange([...value, newTag]);
          setInputValue("");
        }
      } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
        e.preventDefault();
        const newTags = [...value];
        newTags.pop();
        onChange(newTags);
      }
    };

    const handleRemoveTag = (tagToRemove: string) => {
      if (disabled) return;
      onChange(value.filter((tag) => tag !== tagToRemove));
    };

    return (
      <div className={cn("flex flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-label-small bg-muted text-muted-foreground">
            <TagIcon className="h-3 w-3" />
            {tag}
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove tag</span>
              </Button>
            )}
          </Badge>
        ))}
        <Input
          {...props}
          ref={ref}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder={value.length === 0 ? "Add tags..." : ""}
          className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 min-w-[80px]"
          disabled={disabled}
        />
      </div>
    );
  }
);
TagInput.displayName = "TagInput";