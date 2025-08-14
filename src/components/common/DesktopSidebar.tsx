import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/auth/SessionContext";
import { ThemeToggle } from "./ThemeToggle";
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

  return (
    <div
      className={cn(
        "flex flex-col bg-sidebar border-l border-sidebar-border transition-all duration-200 ease-in-out",
        isCollapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width-expanded)]"
      )}
      style={{ '--sidebar-width-expanded': '220px', '--sidebar-width-collapsed': '60px' } as React.CSSProperties}
    >
      <div className="flex items-center justify-end p-4 h-16 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-full w-full flex items-center justify-center"
        >
          {isCollapsed ? (
            <ChevronLeft className="h-6 w-6 text-sidebar-primary" />
          ) : (
            <ChevronRight className="h-6 w-6 text-sidebar-primary" />
          )}
        </Button>
      </div>

      <nav className="flex-grow overflow-y-auto px-1 py-2 space-y-1">
        {filteredNavigationItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-2 py-1 text-sm font-semibold text-sidebar-foreground/70 text-right"> {/* Added text-right */}
                {section.title}
              </h3>
            )}
            {section.links.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full justify-end", // Changed justify-start to justify-end
                  isCollapsed ? "px-2 py-2" : "px-3 py-2",
                  location.pathname === item.path
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                asChild
              >
                <Link to={item.path}>
                  {!isCollapsed && <span className="whitespace-nowrap text-right">{item.label}</span>} {/* Added text-right */}
                  <DynamicIcon name={item.icon} className={cn("h-5 w-5", !isCollapsed && "ml-2")} /> {/* Changed mr-2 to ml-2 */}
                </Link>
              </Button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border flex flex-col items-center space-y-2">
        <div className="flex w-full justify-center">
          <ThemeToggle isCollapsed={isCollapsed} />
        </div>
      </div>
    </div>
  );
};

export default DesktopSidebar;