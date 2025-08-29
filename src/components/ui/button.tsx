"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-label-large font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // M3 specific variants
        filled: "bg-primary text-on-primary shadow-md hover:bg-primary/90 active:shadow-sm", // M3 Filled button
        tonal: "bg-secondary-container text-on-secondary-container shadow-sm hover:bg-secondary-container/90 active:shadow-none", // M3 Tonal button
        outlined: "border border-outline text-primary hover:bg-primary/5 active:bg-primary/10", // M3 Outlined button
        text: "text-primary hover:bg-primary/5 active:bg-primary/10 hover:underline-offset-4 hover:underline", // M3 Text button, added hover:underline
        onPrimary: "bg-on-primary text-primary hover:bg-on-primary/90 active:shadow-sm", // For text on primary background
        onSecondary: "bg-on-secondary text-secondary hover:bg-on-secondary/90 active:shadow-sm", // For text on secondary background
      },
      size: {
        default: "h-10 px-4 py-2 rounded-md", // M3 default button height is 40dp
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10 rounded-full", // M3 icon buttons are often circular
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };