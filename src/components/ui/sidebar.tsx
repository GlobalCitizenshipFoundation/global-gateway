"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { PanelLeft, X } from "lucide-react"; // Added X import

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"; // Added Tooltip imports

type SidebarContextProps = {
  open: boolean;
  toggleSidebar: () => void;
  setOpen: (open: boolean) => void; // Changed to accept boolean directly
};

const SidebarContext = React.createContext<SidebarContextProps | undefined>(
  undefined
);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a <Sidebar>");
  }
  return context;
}

type SidebarProps = {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void; // Changed to accept boolean directly
} & React.ComponentPropsWithoutRef<"div">;

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openState, setOpenState] = React.useState(defaultOpen);

    const open = openProp ?? openState;
    // Unified setOpen function to handle both internal state and external prop
    const setOpen = React.useCallback((newOpen: boolean) => {
      setOpenState(newOpen);
      setOpenProp?.(newOpen); // Call external onOpenChange if provided
    }, [setOpenProp]);


    React.useEffect(() => {
      if (typeof document !== "undefined") {
        const storedOpen = document.cookie
          .split(";")
          .find((c) => c.trim().startsWith(`${SIDEBAR_COOKIE_NAME}=`));
        if (storedOpen) {
          setOpen(storedOpen.split("=")[1] === "true");
        }
      }
    }, [setOpen]);

    React.useEffect(() => {
      if (typeof document !== "undefined") {
        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      }
    }, [open]);

    const setOpenMobile = React.useCallback(
      (newOpen: boolean) => {
        setOpen(newOpen);
      },
      [setOpen]
    );

    const toggleSidebar = React.useCallback(() => {
      isMobile ? setOpenMobile(!open) : setOpen(!open);
    }, [isMobile, setOpen, setOpenMobile, open]);

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      if (typeof window !== "undefined") {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }
    }, [toggleSidebar]);

    return (
      <SidebarContext.Provider value={{ open, toggleSidebar, setOpen }}>
        <TooltipProvider delayDuration={0}>
          <div
            ref={ref}
            className={cn("flex h-full", className)}
            style={style}
            {...props}
          >
            {isMobile ? (
              <Sheet open={open} onOpenChange={setOpenMobile}>
                <SheetContent side="left" className="flex w-3/4 flex-col">
                  <SheetHeader>
                    <SheetTitle>Global Gateway</SheetTitle>
                  </SheetHeader>
                  <div className="flex h-full w-full flex-col">{children}</div>
                </SheetContent>
              </Sheet>
            ) : (
              <>
                {/* This is what handles the sidebar gap on desktop */}
                <div
                  className={cn(
                    "h-full shrink-0 transition-all duration-300 ease-in-out",
                    open ? "w-sidebar-open" : "w-sidebar-closed"
                  )}
                />
                <div
                  className={cn(
                    "fixed left-0 top-0 z-40 flex h-full flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
                    open ? "w-sidebar-open" : "w-sidebar-closed"
                  )}
                >
                  <div
                    data-sidebar="sidebar"
                    className={cn(
                      "flex h-full flex-col",
                      open ? "w-sidebar-open" : "w-sidebar-closed"
                    )}
                  >
                    {children}
                  </div>
                </div>
              </>
            )}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
Sidebar.displayName = "Sidebar";

const SidebarToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarToggle.displayName = "SidebarToggle";

const SidebarClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { setOpen } = useSidebar();
  return (
    <button
      ref={ref}
      className={cn(
        "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
});
SidebarClose.displayName = "SidebarClose";

const SidebarMain = React.forwardRef<
  HTMLElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <main
      ref={ref}
      className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        open ? "ml-sidebar-open" : "ml-sidebar-closed",
        className
      )}
      {...props}
    />
  );
});
SidebarMain.displayName = "SidebarMain";

const SidebarSearch = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  const { open } = useSidebar();
  return (
    <Input
      ref={ref}
      type="search"
      placeholder={open ? "Search..." : ""}
      className={cn(
        "h-9 w-full rounded-none border-0 border-b bg-transparent px-4 py-2 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      {...props}
    />
  );
});
SidebarSearch.displayName = "SidebarSearch";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between p-4",
        className
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between p-4",
        className
      )}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      className={cn("my-2", className)}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarNav = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex-1 overflow-auto p-2",
        className
      )}
      {...props}
    />
  );
});
SidebarNav.displayName = "SidebarNav";

const SidebarNavList = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      className={cn(
        "flex flex-col space-y-1",
        className
      )}
      {...props}
    />
  );
});
SidebarNavList.displayName = "SidebarNavList";

const SidebarNavItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => {
  return (
    <li
      ref={ref}
      className={cn(
        "relative",
        className
      )}
      {...props}
    />
  );
});
SidebarNavItem.displayName = "SidebarNavItem";

const SidebarNavLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean;
    showOnHover?: boolean;
    tooltip?: React.ReactNode;
  }
>(({ asChild = false, showOnHover = false, tooltip, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  const { open } = useSidebar();

  const content = (
    <Comp
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        !open && "justify-center",
        className
      )}
      {...props}
    />
  );

  return showOnHover && !open ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{tooltip || props.children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    content
  );
});
SidebarNavLink.displayName = "SidebarNavLink";

const SidebarNavLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-3 py-2 text-xs font-semibold uppercase text-sidebar-foreground",
      className
    )}
    {...props}
  />
));
SidebarNavLabel.displayName = "SidebarNavLabel";

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1",
      className
    )}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean; showOnHover?: boolean; tooltip?: React.ReactNode; }
>(({ className, asChild = false, showOnHover = false, tooltip, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const { open } = useSidebar();

  const content = (
    <Comp
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        !open && "justify-center",
        className
      )}
      {...props}
    />
  );

  return showOnHover && !open ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{tooltip || props.children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    content
  );
});
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarMenuTitle = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-3 py-2 text-sm font-semibold text-sidebar-foreground",
      className
    )}
    {...props}
  />
));
SidebarMenuTitle.displayName = "SidebarMenuTitle";

const SidebarMenuDescription = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-3 text-xs text-sidebar-foreground",
      className
    )}
    {...props}
  />
));
SidebarMenuDescription.displayName = "SidebarMenuDescription";

const SidebarMenuLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & { asChild?: boolean; showOnHover?: boolean; tooltip?: React.ReactNode; }
>(({ asChild = false, showOnHover = false, tooltip, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  const { open } = useSidebar();

  const content = (
    <Comp
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        !open && "justify-center",
        className
      )}
      {...props}
    />
  );

  return showOnHover && !open ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{tooltip || props.children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    content
  );
});
SidebarMenuLink.displayName = "SidebarMenuLink";

const SidebarMenuSub = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1 pl-6",
      className
    )}
    {...props}
  />
));
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & { asChild?: boolean; size?: "sm" | "md"; isActive?: boolean; }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  const { open } = useSidebar();

  return (
    <Comp
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        size === "sm" && "h-8 px-2 text-xs",
        isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
        !open && "justify-center",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuSubLink.displayName = "SidebarMenuSubLink";

export {
  Sidebar,
  SidebarToggle,
  SidebarClose,
  SidebarMain,
  SidebarSearch,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarNav,
  SidebarNavList,
  SidebarNavItem,
  SidebarNavLink,
  SidebarNavLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuTitle,
  SidebarMenuDescription,
  SidebarMenuLink,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubLink,
};