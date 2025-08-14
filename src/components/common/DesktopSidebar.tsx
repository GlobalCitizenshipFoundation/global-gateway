import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/auth/SessionContext";
import { ThemeToggle } from "./ThemeToggle";
import UserNav from "./UserNav";
import DynamicIcon from "./DynamicIcon";
import { NAVIGATION_ITEMS } from "@/constants/navigation";

interface DesktopSidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const DesktopSidebar = ({ isCollapsed, toggleCollapse }: DesktopSidebarProps) => {
  const location = useLocation();
  const { profile } = useSession();

  const userRole = profile?.role;

  const filteredNavigationItems = NAVIGATION_ITEMS.map(section => ({
    ...section,
    links: section.links.filter(link => {
      if (!link.roles) return true;
      return userRole && link.roles.includes(userRole);
    })
  })).filter(section => section.links.length > 0);

  const renderNavigation = (collapsed: boolean) => (
    <nav className="flex-grow overflow-y-auto p-2 space-y-2">
      {filteredNavigationItems.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-1">
          {!collapsed && (
            <h3 className="px-2 py-1 text-sm font-semibold text-sidebar-foreground/70">
              {section.title}
            </h3>
          )}
          {section.links.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                collapsed ? "px-2 py-2" : "px-4 py-2",
                location.pathname === item.path
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              asChild
            >
              <Link to={item.path}>
                <DynamicIcon name={item.icon} className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            </Button>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out",
        isCollapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width-expanded)]"
      )}
      style={{ '--sidebar-width-expanded': '250px', '--sidebar-width-collapsed': '80px' } as React.CSSProperties}
    >
      <div className="flex items-center justify-center p-4 h-16 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <Award className="h-6 w-6 text-sidebar-primary" />
          {/* Removed app name from here */}
        </Link>
      </div>

      {renderNavigation(isCollapsed)}

      <div className="p-4 border-t border-sidebar-border flex flex-col items-center space-y-2">
        <div className="flex w-full justify-center">
          <ThemeToggle isCollapsed={isCollapsed} />
        </div>
        <div className="w-full flex justify-center">
          <UserNav isCollapsed={isCollapsed} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="mt-2 w-full"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-sidebar-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default DesktopSidebar;