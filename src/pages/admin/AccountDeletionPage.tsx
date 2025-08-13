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
import { showError, showSuccess } from "@/utils/toast";
import { ApproveDeletionDialog } from "@/components/admin/ApproveDeletionDialog";
import { DenyDeletionDialog } from "@/components/admin/DenyDeletionDialog";

type DeletionRequest = {
  id: string;
  user_id: string;
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
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isDenyDialogOpen, setIsDenyDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('account_deletion_requests')
      .select('id, user_id, request_date, status, profiles(first_name, last_name, email)')
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);

    const { error: functionError } = await supabase.functions.invoke('delete-user', {
      body: { userId: selectedRequest.user_id },
    });

    if (functionError) {
      showError(`Failed to delete user: ${functionError.message}`);
      setIsProcessing(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('account_deletion_requests')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('id', selectedRequest.id);

    if (dbError) {
      showError(`User deleted, but failed to update request status: ${dbError.message}`);
    } else {
      showSuccess("Account deleted and request completed.");
      fetchRequests(); // Refresh the list
    }
    setIsProcessing(false);
    setIsApproveDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleDeny = async (notes: string) => {
    if (!selectedRequest) return;
    setIsProcessing(true);

    const { error } = await supabase
      .from('account_deletion_requests')
      .update({ status: 'denied', admin_notes: notes, processed_at: new Date().toISOString() })
      .eq('id', selectedRequest.id);

    if (error) {
      showError(`Failed to deny request: ${error.message}`);
    } else {
      showSuccess("Request denied successfully.");
      fetchRequests(); // Refresh the list
    }
    setIsProcessing(false);
    setIsDenyDialogOpen(false);
    setSelectedRequest(null);
    setAdminNotes('');
  };

  const getFullName = (profile: DeletionRequest['profiles'] | undefined) => {
    return [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || profile?.email;
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
    <>
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
                      <Badge variant={req.status === 'pending' ? 'destructive' : req.status === 'completed' ? 'default' : 'secondary'}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(req); setIsDenyDialogOpen(true); }}>Deny</Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelectedRequest(req); setIsApproveDialogOpen(true); }}>Approve Deletion</Button>
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

      <ApproveDeletionDialog
        isOpen={isApproveDialogOpen}
        onClose={() => setIsApproveDialogOpen(false)}
        onConfirm={handleApprove}
        userName={getFullName(selectedRequest?.profiles) || 'this user'}
        isProcessing={isProcessing}
      />

      <DenyDeletionDialog
        isOpen={isDenyDialogOpen}
        onClose={() => setIsDenyDialogOpen(false)}
        onConfirm={handleDeny}
        userName={getFullName(selectedRequest?.profiles) || 'this user'}
        notes={adminNotes}
        setNotes={setAdminNotes}
        isProcessing={isProcessing}
      />
    </>
  );
};

export default AccountDeletionPage;