import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Profile } from "@/types";
import { UserCheck } from "lucide-react"; // Import UserCheck icon

// Move getInitials outside the component to prevent re-creation on every render
const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserNav = () => {
  const { user, profile, impersonatingAsProfile, stopImpersonation } = useSession(); // Get profile and impersonation state
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

  const displayProfile = impersonatingAsProfile || profile;
  const displayFullName = displayProfile?.first_name && displayProfile?.last_name 
    ? `${displayProfile.first_name} ${displayProfile.last_name}` 
    : user?.email; // Fallback to email if no name

  const displayAvatarUrl = displayProfile?.avatar_url;

  const creatorRoles: Profile['role'][] = ['creator', 'admin', 'super_admin'];
  const adminRoles: Profile['role'][] = ['admin', 'super_admin'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative h-8 w-8 rounded-full cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarImage src={displayAvatarUrl || undefined} alt={displayFullName || 'User'} />
            <AvatarFallback>
              {displayFullName ? getInitials(displayFullName) : 'U'}
            </AvatarFallback>
          </Avatar>
          {impersonatingAsProfile && (
            <UserCheck className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500 bg-background rounded-full p-0.5 border border-green-500" />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayFullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {impersonatingAsProfile && (
              <p className="text-xs leading-none text-green-500 flex items-center gap-1 mt-1">
                <UserCheck className="h-3 w-3" /> Impersonating as {impersonatingAsProfile.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/dashboard">My Submissions</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile">Profile</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        {displayProfile && creatorRoles.includes(displayProfile.role) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Creator</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/creator/dashboard">Manage Programs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/creator/forms">Manage Forms</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/creator/workflow-templates">Manage Workflows</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        {displayProfile && adminRoles.includes(displayProfile.role) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Admin</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/admin/dashboard">Admin Dashboard</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        {impersonatingAsProfile ? (
          <DropdownMenuItem onClick={stopImpersonation} className="text-red-500 focus:text-red-500">
            Stop Impersonating
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleLogout}>
            Log out
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;