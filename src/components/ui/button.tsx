import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-label-large font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // High Emphasis
        filled: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
        // Medium Emphasis
        tonal: "bg-secondary-container text-on-secondary-container shadow-sm hover:bg-secondary-container/80",
        elevated: "bg-card text-foreground shadow-md hover:bg-muted", // Uses card as surface, muted for hover
        outlined: "border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        // Low Emphasis
        text: "text-primary hover:bg-primary-container hover:text-on-primary-container",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Special Cases
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-md", // M3 default rounded-md (8px)
        sm: "h-9 rounded-sm px-3", // M3 small rounded-sm (4px)
        lg: "h-11 rounded-lg px-8", // M3 large rounded-lg (12px)
        icon: "h-10 w-10 rounded-full", // M3 icon button is typically circular
      },
    },
    defaultVariants: {
      variant: "filled",
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