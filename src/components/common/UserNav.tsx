import AvatarWithInitials from "@/components/common/AvatarWithInitials";
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

interface UserNavProps {
  isCollapsed?: boolean; // New prop to handle collapsed state
}

const UserNav = ({ isCollapsed = false }: UserNavProps) => {
  const { user } = useSession();
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
  const avatarUrl = user?.user_metadata?.avatar_url;

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-8 flex items-center justify-center",
            isCollapsed ? "w-8 p-0" : "w-full px-2 py-2",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <AvatarWithInitials name={fullName} src={avatarUrl} className="h-8 w-8 cursor-pointer" />
          {!isCollapsed && (
            <div className="ml-3 flex-grow text-left">
              <p className="text-sm font-medium leading-none text-sidebar-foreground">{fullName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
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