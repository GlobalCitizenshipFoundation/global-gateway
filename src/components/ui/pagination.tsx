"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants, type VariantProps } from "@/components/ui/button"; // Import buttonVariants and VariantProps

export type PaginationLinkProps = {
  isActive?: boolean;
  // Correctly reference the 'size' prop type from buttonVariants's VariantProps
  size?: VariantProps<typeof buttonVariants>["size"];
} & React.ComponentPropsWithoutRef<typeof Link>; // Extend Link's props for the base HTML attributes

function PaginationLink({
  className,
  isActive,
  size, // Accept size for styling
  ...props
}: PaginationLinkProps) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost", // Use outline for active, ghost for others
          size,
        }),
        className
      )}
      {...props}
    />
  );
}
PaginationLink.displayName = "PaginationLink";