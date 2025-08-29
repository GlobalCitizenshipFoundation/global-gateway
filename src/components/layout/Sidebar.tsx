"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, LayoutDashboard, Users, Workflow, Settings, Briefcase, FileText, Calendar, Mail, BarChart3, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";

interface NavLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon: Icon, label, isActive }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-body-medium font-medium transition-colors",
      isActive
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )}
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </Link>
);

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <aside className="hidden md:block w-64 border-r border-border bg-sidebar-background p-4 space-y-6">
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
    <aside className="hidden md:block w-64 border-r border-border bg-sidebar-background p-4 space-y-6">
      <div className="flex items-center gap-2 text-title-large font-bold text-sidebar-primary mb-6">
        <Award className="h-6 w-6" />
        <span>Navigation</span>
      </div>
      <nav className="grid items-start gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </nav>
    </aside>
  );
}