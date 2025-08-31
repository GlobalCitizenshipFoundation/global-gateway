"use client";

import * as React from "react";
import Link, { LinkProps } from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants, type VariantProps } from "@/components/ui/button";

// Define PaginationLinkProps by extending LinkProps and adding custom props
export interface PaginationLinkProps extends LinkProps {
  isActive?: boolean;
  size?: VariantProps<typeof buttonVariants>["size"];
  // Allow any additional props that Link might pass to its underlying <a> tag
  // This is typically handled by LinkProps itself, but explicitly adding for clarity
  className?: string;
  children?: React.ReactNode;
}

function PaginationLink({
  className,
  isActive,
  size,
  ...props
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
      {...props}
    />
  );
}
PaginationLink.displayName = "PaginationLink";