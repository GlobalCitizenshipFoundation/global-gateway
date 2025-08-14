import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Award, Menu } from "lucide-react"; // Import Menu icon
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
    <nav className="flex-grow overflow-y-auto px-1 py-2 space-y-1"> {/* Adjusted padding */}
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
                collapsed ? "px-2 py-2" : "px-3 py-2", // Adjusted padding for menu items
                location.pathname === item.path
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              asChild
            >
              <Link to={item.path}>
                <DynamicIcon name={item.icon} className={cn("h-5 w-5", !collapsed && "mr-2")} /> {/* Adjusted margin */}
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
        "flex flex-col bg-sidebar border-l border-sidebar-border transition-all duration-200 ease-in-out", // Changed border-r to border-l
        isCollapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width-expanded)]"
      )}
      style={{ '--sidebar-width-expanded': '220px', '--sidebar-width-collapsed': '60px' } as React.CSSProperties} // Adjusted widths
    >
      <div className="flex items-center justify-center p-4 h-16 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="w-full h-full flex items-center justify-center"
        >
          <Menu className="h-6 w-6 text-sidebar-primary" />
          {!isCollapsed && <span className="ml-2 text-xl font-bold text-sidebar-foreground whitespace-nowrap">Global Gateway</span>}
        </Button>
      </div>

      {renderNavigation(isCollapsed)}

      <div className="p-4 border-t border-sidebar-border flex flex-col items-center space-y-2">
        <div className="flex w-full justify-center">
          <ThemeToggle isCollapsed={isCollapsed} />
        </div>
        {/* UserNav removed from here as it's in the Header */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="mt-2 w-full"
        >
          {isCollapsed ? (
            <ChevronLeft className="h-5 w-5 text-sidebar-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-sidebar-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default DesktopSidebar;