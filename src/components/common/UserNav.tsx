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
import DynamicIcon from "./DynamicIcon";
import { Badge } from "@/components/ui/badge";
import React from "react"; // Explicit React import

const UserNav = () => {
  const { user, profile } = useSession();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
    } else {
      showSuccess("Logged out successfully");
      navigate("/");
    }
  };

  const firstName = user?.user_metadata?.first_name as string | undefined;
  const middleName = user?.user_metadata?.middle_name as string | undefined;
  const lastName = user?.user_metadata?.last_name as string | undefined;

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
  const userRole = profile?.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-8 flex items-center justify-center px-2 py-2",
            "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <DynamicIcon name="Handshake" className="h-5 w-5 mr-2" />
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