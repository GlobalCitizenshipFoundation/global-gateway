import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserData } from "../../hooks/admin/useUserData";
import { UsersTable } from "@/components/admin/UsersTable";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Profile } from "@/types";
import { useSession } from "@/contexts/auth/SessionContext";

const UserManagementPage = () => {
  const { user } = useSession();
  const { users, setUsers, loading, error } = useUserData();

  const handleRoleChange = async (userId: string, newRole: Profile['role']) => {
    const originalUsers = [...users];
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      showError(`Failed to update role: ${error.message}`);
      setUsers(originalUsers); // Revert on error
    } else {
      showSuccess("User role updated successfully.");
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-9 w-48" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="container py-12 text-center text-destructive">Error: {error}</div>;
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">View and manage all users in the system.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <UsersTable users={users} onRoleChange={handleRoleChange} currentUserId={user?.id} />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementPage;