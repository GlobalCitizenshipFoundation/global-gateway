import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/contexts/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import DynamicIcon from "./DynamicIcon"; // Import DynamicIcon
import { Badge } from "@/components/ui/badge"; // Import Badge

const UserNav = () => {
  const { user, profile } = useSession(); // Get profile for role
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
    } else {
      showSuccess("Logged out successfully");
      navigate("/");
    }
  };

  const firstName = user?.user_metadata?.first_name;
  const middleName = user?.user_metadata?.middle_name;
  const lastName = user?.user_metadata?.last_name;

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
  const userRole = profile?.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-8 flex items-center justify-center px-2 py-2", // Adjusted padding
            "hover:bg-accent hover:text-accent-foreground" // Use general accent for header
          )}
        >
          <DynamicIcon name="Handshake" className="h-5 w-5 mr-2" /> {/* Handwave icon */}
          <div className="flex-grow text-left">
            <p className="text-sm font-medium leading-none">Hi, {fullName || 'User'}</p>
            {userRole && (
              <Badge variant="secondary" className="mt-1 capitalize text-xs">
                {userRole.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Hi, {fullName || 'User'}</p>
            {userRole && (
              <p className="text-xs leading-none text-muted-foreground capitalize">
                Access: {userRole.replace('_', ' ')}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/profile">Profile</Link>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;