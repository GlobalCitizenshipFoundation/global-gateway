"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative overflow-hidden">
          {/* Sun icon: visible and normal in light mode, faded and larger in dark mode (watermark) */}
          <Sun className="absolute inset-0 m-auto h-[1.2rem] w-[1.2rem] transition-all duration-300 opacity-100 scale-100 dark:opacity-20 dark:scale-150" />
          {/* Moon icon: faded and larger in light mode (watermark), visible and normal in dark mode */}
          <Moon className="absolute inset-0 m-auto h-[1.2rem] w-[1.2rem] transition-all duration-300 opacity-20 scale-150 dark:opacity-100 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
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