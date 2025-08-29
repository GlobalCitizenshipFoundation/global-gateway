"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, LayoutDashboard, Users, Workflow, Settings, Briefcase, FileText, Calendar, Mail, BarChart3, UserCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        isCollapsed ? "justify-center" : "justify-end flex-row-reverse" // Right-align text when expanded, center icon when collapsed
      )}
    >
      <Icon className="h-5 w-5" />
      {!isCollapsed && <span className="text-right flex-grow">{label}</span>}
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
        <TooltipContent side="left" className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
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

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <aside className="hidden md:block w-64 border-l border-border bg-sidebar-background p-4 space-y-6 rounded-xl shadow-lg">
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

  const adminNavItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "User Management" },
    { href: "/admin/settings", icon: Settings, label: "System Settings" },
  ];

  const workbenchNavItems = [
    { href: "/workbench/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/workbench/pathway-templates", icon: Workflow, label: "Pathway Templates" },
    { href: "/workbench/campaigns", icon: Briefcase, label: "Campaigns" },
    { href: "/workbench/applications", icon: FileText, label: "Applications" },
    { href: "/workbench/evaluations", icon: Award, label: "Evaluations" },
    { href: "/workbench/scheduling", icon: Calendar, label: "Scheduling" },
    { href: "/workbench/communications", icon: Mail, label: "Communications" },
    { href: "/workbench/reports", icon: BarChart3, label: "Reports" },
  ];

  const portalNavItems = [
    { href: "/portal/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/portal/my-applications", icon: FileText, label: "My Applications" },
    { href: "/portal/profile", icon: UserCircle2, label: "Profile" },
  ];

  let navItems: { href: string; icon: React.ElementType; label: string }[] = [];

  if (userRole === 'admin') {
    navItems = adminNavItems;
  } else if (['coordinator', 'evaluator', 'screener'].includes(userRole)) {
    navItems = workbenchNavItems;
  } else if (userRole === 'applicant') {
    navItems = portalNavItems;
  }

  if (!user || navItems.length === 0) {
    return null; // Or a minimal sidebar for unauthenticated/unassigned roles
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "hidden md:flex flex-col border-l border-border bg-sidebar-background p-4 space-y-6 rounded-xl shadow-lg transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("flex items-center gap-2 text-title-large font-bold text-sidebar-primary mb-6", isCollapsed ? "justify-center" : "justify-end flex-row-reverse")}>
          {!isCollapsed && <span>Navigation</span>}
          <Award className="h-6 w-6" />
        </div>
        <nav className="grid items-start gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={pathname.startsWith(item.href)}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
        <div className={cn("mt-auto pt-4", isCollapsed ? "flex justify-center" : "flex justify-end")}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={toggleCollapsed}
          >
            {isCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            <span className="sr-only">{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}