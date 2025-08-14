import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { Link } from "react-router-dom";
import UserNav from "./UserNav";
import { useSession } from "@/contexts/auth/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";

const Header = () => {
  const { session, isLoading } = useSession();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      {/* Changed py-4 to h-16 and added items-center for vertical centering */}
      <div className="flex items-center justify-between px-4 h-16 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          {/* Removed Award icon from here */}
          <span className="text-xl font-bold">Global Gateway</span>
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
        </nav>
      </div>
    </header>
  );
};

export default Header;