"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, LayoutDashboard, Users, Workflow, Settings, Briefcase, FileText, Calendar, Mail, BarChart3, UserCircle2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator"; // Import Separator

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon: Icon, label, isActive, isCollapsed }) => {
  const linkContent = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-body-medium font-medium transition-colors duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isCollapsed ? "justify-center" : "justify-start"
      )}
    >
      <Icon className="h-5 w-5" />
      {!isCollapsed && <span className="flex-grow">{label}</span>}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href}>
            {linkContent}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={href}>
      {linkContent}
    </Link>
  );
};

interface NavigationItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
  roles: string[]; // Roles that can see this section
}

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobile: boolean;
  isOpen: boolean;
  closeSidebar: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapsed, isMobile, isOpen, closeSidebar }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar-background p-4 space-y-6 rounded-xl shadow-lg">
        <Skeleton className="h-8 w-3/4 mb-6" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </aside>
    );
  }

  const userRole: string = user?.user_metadata?.role || '';

  const allNavigationSections: NavigationSection[] = [
    {
      title: "Admin Tools",
      items: [
        { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/admin/users", icon: Users, label: "User Management" },
        { href: "/admin/settings", icon: Settings, label: "System Settings" },
      ],
      roles: ['admin'],
    },
    {
      title: "Workbench Tools",
      items: [
        { href: "/workbench/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/workbench/pathway-templates", icon: Workflow, label: "Pathway Templates" },
        { href: "/workbench/campaigns", icon: Briefcase, label: "Campaigns" },
        { href: "/workbench/applications", icon: FileText, label: "Applications" },
        { href: "/workbench/evaluations", icon: Award, label: "Evaluations" },
        { href: "/workbench/scheduling", icon: Calendar, label: "Scheduling" },
        { href: "/workbench/communications", icon: Mail, label: "Communications" },
        { href: "/workbench/reports", icon: BarChart3, label: "Reports" },
      ],
      roles: ['admin', 'coordinator', 'evaluator', 'screener'],
    },
    {
      title: "Portal Tools",
      items: [
        { href: "/portal/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/portal/my-applications", icon: FileText, label: "My Applications" },
        { href: "/portal/profile", icon: UserCircle2, label: "Profile" },
      ],
      roles: ['admin', 'coordinator', 'evaluator', 'screener', 'applicant'],
    },
  ];

  const visibleNavigationSections = allNavigationSections.filter(section =>
    section.roles.includes(userRole)
  );

  if (!user || visibleNavigationSections.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-sidebar-background p-4 space-y-6 shadow-lg transition-all duration-300",
          // Desktop styles
          !isMobile && (isCollapsed ? "w-20 rounded-xl" : "w-64 rounded-xl"),
          // Mobile styles (modal)
          isMobile && "fixed inset-y-0 left-0 z-40 h-full w-64 transform bg-sidebar-background rounded-r-xl",
          isMobile && (isOpen ? "translate-x-0" : "-translate-x-full")
        )}
      >
        <div className={cn("flex items-center gap-2 text-title-large font-bold text-sidebar-primary mb-6", isCollapsed ? "justify-center" : "justify-start")}>
          {isMobile && (
            <Button variant="ghost" size="icon" className="rounded-full mr-2" onClick={closeSidebar}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close Sidebar</span>
            </Button>
          )}
          <Award className="h-6 w-6" />
          {!isCollapsed && <span>Navigation</span>}
        </div>
        <nav className="grid items-start gap-2 flex-grow"> {/* flex-grow to push toggle button to bottom */}
          {visibleNavigationSections.map((section, sectionIndex) => (
            <React.Fragment key={section.title}>
              {!isCollapsed && (
                <h3 className="text-label-medium font-semibold text-muted-foreground uppercase mt-4 mb-2 px-3">
                  {section.title}
                </h3>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={pathname.startsWith(item.href)}
                  isCollapsed={isCollapsed}
                />
              ))}
              {sectionIndex < visibleNavigationSections.length - 1 && (
                <Separator className={cn("my-4 bg-border", isCollapsed && "w-1/2 mx-auto")} />
              )}
            </React.Fragment>
          ))}
        </nav>
        {!isMobile && ( // Only show toggle button on desktop
          <div className={cn("mt-auto pt-4", isCollapsed ? "flex justify-center" : "flex justify-end")}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={toggleCollapsed}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              <span className="sr-only">{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
            </Button>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}