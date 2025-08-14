import { Button } from "@/components/ui/button";
import { Award, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import UserNav from "./UserNav";
import { useSession } from "@/contexts/auth/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import { SheetTrigger } from "@/components/ui/sheet";
import React from "react"; // Explicit React import

interface HeaderProps {
  isMobile: boolean;
  onOpenMobileMenu: () => void;
}

const Header = ({ isMobile, onOpenMobileMenu }: HeaderProps) => {
  const { session, isLoading } = useSession();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Award className="h-7 w-7 md:h-8 md:w-8 text-primary" />
          <span className="text-lg md:text-xl lg:text-2xl font-bold">Global Gateway</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            session ? (
              <UserNav />
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild>
                  <Link to="/login">Sign Up</Link>
                </Button>
              </>
            )
          )}
          {isMobile && (
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onOpenMobileMenu}>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;