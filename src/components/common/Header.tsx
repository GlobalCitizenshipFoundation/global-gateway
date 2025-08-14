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
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Global Gateway</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-10 w-24" />
          ) : ( // Corrected: This ')' closes the 'isLoading' true branch.
            session ? ( // This is the start of the nested ternary for 'session'.
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