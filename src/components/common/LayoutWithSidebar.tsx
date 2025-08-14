import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Award, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/auth/SessionContext";
import { ThemeToggle } from "./ThemeToggle";
import UserNav from "./UserNav";
import DynamicIcon from "./DynamicIcon";
import { NAVIGATION_ITEMS } from "@/constants/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/common/use-mobile";
import DesktopSidebar from "./DesktopSidebar";
import Header from "./Header";
import { Profile } from "@/types"; // Import Profile type

interface LayoutWithSidebarProps {
  children: React.ReactNode;
}

const LayoutWithSidebar = ({ children }: LayoutWithSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();
  const { profile } = useSession();
  const isMobile = useIsMobile();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const userRole: Profile['role'] | undefined = profile?.role;

  const filteredNavigationItems = NAVIGATION_ITEMS.map((section: any) => ({
    ...section,
    links: section.links.filter((link: any) => {
      if (!link.roles) return true;
      return userRole && link.roles.includes(userRole);
    })
  })).filter((section: any) => section.links.length > 0);

  const renderMobileNavigation = (closeMobileMenu?: () => void) => (
    <nav className="flex-grow overflow-y-auto p-2 space-y-2">
      {filteredNavigationItems.map((section: any, sectionIndex: number) => (
        <div key={sectionIndex} className="space-y-1">
          {section.title && (
            <h3 className="px-2 py-1 text-sm font-semibold text-sidebar-foreground/70 text-right">
              {section.title}
            </h3>
          )}
          {section.links.map((item: any) => (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-end px-4 py-2",
                location.pathname === item.path
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              asChild
              onClick={closeMobileMenu}
            >
              <Link to={item.path} className="flex items-center justify-end w-full">
                <span className="text-right">{item.label}</span>
                <DynamicIcon name={item.icon as any} className="h-5 w-5 ml-3" />
              </Link>
            </Button>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex flex-row-reverse min-h-screen bg-background">
      {/* Desktop Sidebar - Only rendered if not mobile */}
      {!isMobile && (
        <DesktopSidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      )}

      {/* Sheet wraps Header and main content. It's always rendered to provide context for SheetTrigger. */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <div
          className={cn(
            "flex flex-col flex-grow overflow-x-hidden",
            // Removed the margin-right classes here. The flex-grow should handle it.
          )}
        >
          {/* Header always renders, passes mobile state and menu toggle */}
          <Header isMobile={isMobile} onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
          
          <main className="flex-grow transition-all duration-200 ease-in-out">
            {children}
          </main>
        </div>

        {/* SheetContent (mobile sidebar) - Only visible on mobile */}
        {isMobile && (
          <SheetContent side="right" className="w-64 p-0 flex flex-col bg-sidebar border-l border-sidebar-border">
            <div className="flex items-center justify-end p-4 h-16 border-b border-sidebar-border">
              {/* This div can be kept for spacing/border if needed, but the close button is gone */}
            </div>
            {renderMobileNavigation(() => setIsMobileMenuOpen(false))}
            <div className="p-4 border-t border-sidebar-border flex flex-col items-end space-y-2">
              <div className="flex w-full justify-end">
                <ThemeToggle isCollapsed={false} />
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
};

export default LayoutWithSidebar;