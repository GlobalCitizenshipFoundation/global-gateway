import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { useSession } from "@/contexts/SessionContext";
import { Badge } from "@/components/ui/badge";

const UserImpersonationList = () => {
  const { user, profile, startImpersonation, impersonatingAsProfile } = useSession();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (profile?.role !== 'super_admin') {
        setError("You do not have permission to view this page.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          role,
          users ( email )
        `)
        .order('created_at', { ascending: true });

      if (error) {
        showError("Failed to fetch users: " + error.message);
        setError(error.message);
      } else if (data) {
        const formattedUsers = data.map(p => ({
          ...p,
          users: Array.isArray(p.users) ? p.users[0] : p.users,
          full_name: [p.first_name, p.last_name].filter(Boolean).join(' ').trim(),
        }));
        setUsers(formattedUsers as Profile[]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [profile]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <div className="text-center text-destructive">Error: {error}</div>;
  }

  if (profile?.role !== 'super_admin') {
    return <div className="text-center text-destructive">Access Denied: You must be a Super Admin to view this feature.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Impersonation</CardTitle>
        <CardDescription>
          As a Super Admin, you can temporarily view the platform as another user.
          This is for testing and debugging purposes only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {impersonatingAsProfile && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md flex items-center justify-between">
            <span>Currently impersonating: <span className="font-semibold">{impersonatingAsProfile.first_name} {impersonatingAsProfile.last_name} ({impersonatingAsProfile.role})</span></span>
            <Button variant="outline" size="sm" onClick={stopImpersonation}>Stop Impersonating</Button>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.full_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">{u.users?.email || 'N/A'}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => startImpersonation(u.id)}
                    disabled={impersonatingAsProfile?.id === u.id || user?.id === u.id}
                  >
                    {impersonatingAsProfile?.id === u.id ? 'Impersonating' : (user?.id === u.id ? 'Yourself' : 'Impersonate')}
                  </Button>
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
      </CardContent>
    </Card>
  );
};

export default UserImpersonationList;