import { Tag } from "@/types";
    import { Badge } from "@/components/ui/badge";
    import { cn } from "@/lib/utils";

    interface TagDisplayProps {
      tag: Tag;
      className?: string;
    }

    export const TagDisplay = ({ tag, className }: TagDisplayProps) => {
      // Dynamically apply Tailwind classes based on the tag.color
      const tagClasses = cn(
        `bg-tag-${tag.color}`,
        `text-tag-${tag.color}-foreground`,
        "hover:bg-opacity-80", // Add a subtle hover effect
        className
      );

      return (
        <Badge className={tagClasses}>
          {tag.name}
        </Badge>
      );
    };