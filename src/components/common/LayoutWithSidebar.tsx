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
import DesktopSidebar from "./DesktopSidebar"; // Import the new DesktopSidebar
import Header from "./Header"; // Import the Header component

interface LayoutWithSidebarProps {
  children: React.ReactNode;
}

const LayoutWithSidebar = ({ children }: LayoutWithSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { profile } = useSession();
  const isMobile = useIsMobile();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const userRole = profile?.role;

  const filteredNavigationItems = NAVIGATION_ITEMS.map(section => ({
    ...section,
    links: section.links.filter(link => {
      if (!link.roles) return true;
      return userRole && link.roles.includes(userRole);
    })
  })).filter(section => section.links.length > 0);

  // This function is now specific to the mobile sheet, as DesktopSidebar has its own internal renderNavigation
  const renderMobileNavigation = (closeMobileMenu?: () => void) => (
    <nav className="flex-grow overflow-y-auto p-2 space-y-2">
      {filteredNavigationItems.map((section, sectionIndex) => (
        <div key={sectionIndex} className="space-y-1">
          <h3 className="px-2 py-1 text-sm font-semibold text-sidebar-foreground/70">
            {section.title}
          </h3>
          {section.links.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start px-4 py-2",
                location.pathname === item.path
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              asChild
              onClick={closeMobileMenu} // Close mobile menu on item click
            >
              <Link to={item.path}>
                <DynamicIcon name={item.icon} className="h-5 w-5 mr-3" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {isMobile ? (
        // Mobile Sidebar (Sheet)
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-40">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col bg-sidebar border-r border-sidebar-border">
            <div className="flex items-center justify-between p-4 h-16 border-b border-sidebar-border">
              <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <Award className="h-6 w-6 text-sidebar-primary" />
                <span className="text-xl font-bold text-sidebar-foreground whitespace-nowrap">Global Gateway</span>
              </Link>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
            {renderMobileNavigation(() => setIsMobileMenuOpen(false))}
            <div className="p-4 border-t border-sidebar-border flex flex-col items-center space-y-2">
              <div className="flex w-full justify-center">
                <ThemeToggle isCollapsed={false} />
              </div>
              {/* UserNav removed from here */}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        // Desktop Sidebar
        <DesktopSidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow"> {/* Added flex-col to stack Header and main content */}
        <Header /> {/* Render Header here */}
        <main className={cn(
          "flex-grow transition-all duration-200 ease-in-out",
          // The ml classes are now handled by the parent div's width and the main content's flex-grow
          // No need for explicit ml here as Header is now part of the main content flow
        )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutWithSidebar;