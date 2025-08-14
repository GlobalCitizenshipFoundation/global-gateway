import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/auth/SessionContext";
import { ThemeToggle } from "./ThemeToggle"; // Import the updated ThemeToggle
import UserNav from "./UserNav";
import DynamicIcon from "./DynamicIcon";
import { NAVIGATION_ITEMS } from "@/constants/navigation";

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar = ({ children }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { profile } = useSession();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const userRole = profile?.role;

  const filteredNavigationItems = NAVIGATION_ITEMS.map(section => ({
    ...section,
    links: section.links.filter(link => {
      if (!link.roles) return true; // If no roles specified, visible to all authenticated
      return userRole && link.roles.includes(userRole);
    })
  })).filter(section => section.links.length > 0); // Only show sections with visible links

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel
        defaultSize={20}
        minSize={isCollapsed ? 5 : 15}
        maxSize={isCollapsed ? 5 : 25}
        collapsedSize={5}
        collapsible={true}
        onCollapse={() => setIsCollapsed(true)}
        onExpand={() => setIsCollapsed(false)}
        className={cn(
          "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-in-out",
          // Removed redundant min-w classes as ResizablePanel's size props handle this
        )}
      >
        <div className="flex items-center justify-center p-4 h-16 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <Award className="h-6 w-6 text-sidebar-primary" />
            {!isCollapsed && <span className="text-xl font-bold text-sidebar-foreground whitespace-nowrap">Global Gateway</span>}
          </Link>
        </div>

        <nav className="flex-grow overflow-y-auto p-2 space-y-2">
          {filteredNavigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-1">
              {!isCollapsed && (
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
                    isCollapsed ? "px-2 py-2" : "px-4 py-2",
                    location.pathname === item.path
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  asChild
                >
                  <Link to={item.path}>
                    <DynamicIcon name={item.icon} className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </Link>
                </Button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border flex flex-col items-center space-y-2">
          <div className="flex w-full justify-center">
            <ThemeToggle isCollapsed={isCollapsed} /> {/* Pass the isCollapsed prop */}
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
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Sidebar;