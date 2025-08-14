import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Import cn

interface ThemeToggleProps {
  isCollapsed?: boolean; // New prop to indicate if the sidebar is collapsed
}

export function ThemeToggle({ isCollapsed = false }: ThemeToggleProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          // Conditionally set size to "icon" when collapsed, otherwise let it expand
          size={isCollapsed ? "icon" : undefined}
          className={cn(
            "relative",
            // When not collapsed, make the button full width and adjust padding
            !isCollapsed && "w-full justify-start px-4 py-2"
          )}
        >
          {/* Wrap all children in a single span to satisfy React.Children.only */}
          <span className="flex items-center">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute" />
            {/* Conditionally render the text label when not collapsed */}
            {!isCollapsed && <span className="ml-3 whitespace-nowrap">Theme</span>}
            <span className="sr-only">Toggle theme</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}