"use client";

import * as React from "react";
import Link, { LinkProps } from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants, type VariantProps } from "@/components/ui/button";

// Define the props for PaginationLink.
// It should accept all props that next/link's Link component accepts (LinkProps),
// plus our custom styling props (isActive, size).
// We explicitly override the types of event handlers that might conflict
// if PaginationLink is used in a context where ButtonProps are passed.
export type PaginationLinkProps = LinkProps & {
  isActive?: boolean;
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  children?: React.ReactNode;
  // Override conflicting event handler types to ensure they are for HTMLAnchorElement
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  onCopy?: React.ClipboardEventHandler<HTMLAnchorElement>;
  onCut?: React.ClipboardEventHandler<HTMLAnchorElement>;
  onPaste?: React.ClipboardEventHandler<HTMLAnchorElement>;
  // Add other event handlers here if they are also causing conflicts
};

function PaginationLink({
  className,
  isActive,
  size,
  ...props // These props should now strictly conform to PaginationLinkProps
}: PaginationLinkProps) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className
      )}
      {...props} // Spreading props that are compatible with LinkProps
    />
  );
}
PaginationLink.displayName = "PaginationLink";