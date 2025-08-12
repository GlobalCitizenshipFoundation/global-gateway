import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { Link } from "react-router-dom";
import UserNav from "./UserNav";

const Header = () => {
  // We'll replace this with real auth state later
  const isLoggedIn = true;

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link to="/" className="flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">ApplyHub</span>
        </Link>
        <nav className="flex items-center gap-2">
          {isLoggedIn ? (
            <UserNav />
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;