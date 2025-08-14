import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TAG_COLORS } from "@/constants/tags";
import { Check, Palette } from "lucide-react";

interface TagColorPickerProps {
  value: string; // The name of the selected color (e.g., 'blue')
  onChange: (colorName: string) => void;
  disabled?: boolean;
}

export const TagColorPicker = ({ value, onChange, disabled }: TagColorPickerProps) => {
  const selectedColor = TAG_COLORS.find((color: { name: string; label: string; hex: string }) => color.name === value) || TAG_COLORS[0]; // Default to first color

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            "flex items-center gap-2",
            `bg-tag-${selectedColor.name}`,
            `text-tag-${selectedColor.name}-foreground`,
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <Palette className="h-4 w-4" />
          <span>{selectedColor.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-4 gap-1">
          {TAG_COLORS.map((color: { name: string; label: string; hex: string }) => (
            <Button
              key={color.name}
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full",
                `bg-tag-${color.name}`, // Apply dynamic background color
                `text-tag-${color.name}-foreground`, // Apply dynamic text color
                "hover:opacity-80",
                value === color.name && "ring-2 ring-offset-2 ring-primary"
              )}
              onClick={() => onChange(color.name)}
              disabled={disabled}
            >
              {value === color.name && <Check className="h-4 w-4" />}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};