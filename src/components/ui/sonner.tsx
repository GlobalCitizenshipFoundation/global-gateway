import React from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { ToasterProps } from "sonner"; // Import ToasterProps type

type Theme = "light" | "dark" | "system";

export function Toaster({ theme, ...props }: ToasterProps & { theme?: Theme }) {
  const { theme: resolvedTheme } = useTheme();

  return (
    <Sonner theme={resolvedTheme as ToasterProps["theme"] || theme} {...props} />
  );
}