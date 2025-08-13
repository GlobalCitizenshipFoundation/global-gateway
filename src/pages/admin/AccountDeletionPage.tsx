import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

type DeletionRequest = {
  id: string;
  request_date: string;
  status: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};

const AccountDeletionPage = () => {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .select('id, request_date, status, profiles(first_name, last_name, email)')
        .order('request_date', { ascending: true });

      if (error) {
        setError(error.message);
        showError("Failed to fetch deletion requests.");
      } else {
        const formattedData = data.map(req => ({
          ...req,
          profiles: Array.isArray(req.profiles) ? req.profiles[0] : req.profiles,
        }));
        setRequests(formattedData as DeletionRequest[]);
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const getFullName = (profile: DeletionRequest['profiles']) => {
    return [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
  };

  if (loading) {
    return (
      <div className="container py-12">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-80 mb-8" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-9 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Deletion Requests</h1>
        <p className="text-muted-foreground">Review and process user requests for account deletion.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-medium">{getFullName(req.profiles) || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{req.profiles?.email}</div>
                  </TableCell>
                  <TableCell>{new Date(req.request_date).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'pending' ? 'destructive' : 'secondary'}>
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {req.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" disabled>Deny</Button>
                        <Button size="sm" disabled>Approve Deletion</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No pending account deletion requests.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountDeletionPage;