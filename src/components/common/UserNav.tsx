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

const REVIEWER_ROLES = ['reviewer', 'lead_reviewer', 'admin', 'super_admin'];
const CREATOR_ROLES = ['creator', 'admin', 'super_admin'];
const ADMIN_ROLES = ['admin', 'super_admin'];
const SUPER_ADMIN_ROLES = ['super_admin'];

const UserNav = () => {
  const { user, profile } = useSession();
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
  const canAccessReviewerTools = profile && REVIEWER_ROLES.includes(profile.role);
  const canAccessCreatorTools = profile && CREATOR_ROLES.includes(profile.role);
  const canAccessAdminTools = profile && ADMIN_ROLES.includes(profile.role);
  const canAccessSuperAdminTools = profile && SUPER_ADMIN_ROLES.includes(profile.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AvatarWithInitials name={fullName} src={avatarUrl} className="h-8 w-8 cursor-pointer" />
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
            <Link to="/dashboard">My Submissions</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile">Profile</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        {canAccessReviewerTools && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Reviewer</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/reviewer/dashboard">Reviewer Dashboard</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        {canAccessCreatorTools && (
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
                <Link to="/creator/workflows">Manage Workflows</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/creator/emails">Manage Email Templates</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/creator/evaluation-templates">Manage Evaluation Templates</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        {canAccessAdminTools && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Admin</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/admin/user-management">User Management</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/tags">Manage Tags</Link> {/* New Tag Management Link */}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        {canAccessSuperAdminTools && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Super Admin</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/admin/account-deletion">Deletion Requests</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;