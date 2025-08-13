import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type DeletionRequest = {
  id: string;
  request_date: string;
  status: 'pending' | 'in_progress' | 'processed' | 'rejected';
  admin_notes: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
};

const AdminDashboardPage = () => {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<'processed' | 'rejected' | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .select(`
          id,
          request_date,
          status,
          admin_notes,
          profiles ( first_name, last_name, email:users(email) )
        `)
        .order('request_date', { ascending: true });

      if (error) {
        showError("Failed to fetch deletion requests: " + error.message);
      } else if (data) {
        const formattedData = data.map(req => ({
          ...req,
          profiles: Array.isArray(req.profiles) ? req.profiles[0] : req.profiles,
        }));
        setRequests(formattedData as any); // Adjust type assertion as needed
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const handleOpenDialog = (request: DeletionRequest, status: 'processed' | 'rejected') => {
    setSelectedRequest(request);
    setNewStatus(status);
    setAdminNotes(request.admin_notes || "");
    setIsDialogOpen(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest || !newStatus) return;

    setIsUpdating(true);
    const { error } = await supabase
      .from('account_deletion_requests')
      .update({
        status: newStatus,
        admin_notes: adminNotes,
        processed_at: new Date().toISOString(),
      })
      .eq('id', selectedRequest.id);

    if (error) {
      showError("Failed to update request: " + error.message);
    } else {
      showSuccess("Request updated successfully.");
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: newStatus, admin_notes: adminNotes } : r));
      setIsDialogOpen(false);
    }
    setIsUpdating(false);
  };

  return (
    <>
      <div className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>Manage account deletion requests.</CardDescription>
          </CardHeader>
          <CardContent>
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
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-36" /></TableCell>
                    </TableRow>
                  ))
                ) : requests.length > 0 ? requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{[req.profiles?.first_name, req.profiles?.last_name].filter(Boolean).join(' ') || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{req.profiles?.email}</div>
                    </TableCell>
                    <TableCell>{new Date(req.request_date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={req.status === 'pending' ? 'default' : 'secondary'}>{req.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' && (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => handleOpenDialog(req, 'processed')}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleOpenDialog(req, 'rejected')}>Reject</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No pending requests.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Deletion Request</DialogTitle>
            <DialogDescription>
              You are about to mark this request as '{newStatus}'. Add any relevant notes below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g., User data has been anonymized."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRequest} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminDashboardPage;