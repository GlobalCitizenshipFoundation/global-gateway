import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Profile } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AvatarWithInitials from "../common/AvatarWithInitials";

interface UsersTableProps {
  users: Profile[];
  onRoleChange: (userId: string, newRole: Profile['role']) => void;
  currentUserId: string | undefined;
}

export const UsersTable = ({ users, onRoleChange, currentUserId }: UsersTableProps) => {
  const getFullName = (user: Profile) => {
    return [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ').trim();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="hidden md:table-cell">Last Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length > 0 ? users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <AvatarWithInitials name={getFullName(user)} src={user.avatar_url} className="h-9 w-9" />
                <div>
                  <div className="font-medium">{getFullName(user) || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Select
                value={user.role}
                onValueChange={(newRole) => onRoleChange(user.id, newRole as Profile['role'])}
                disabled={user.id === currentUserId} // Prevent admin from changing their own role
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applicant">Applicant</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {new Date(user.updated_at).toLocaleString()}
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={3} className="text-center h-24">
              No users found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};