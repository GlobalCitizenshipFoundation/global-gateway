import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DOMPurify from 'dompurify';
import { useSession } from "@/contexts/auth/SessionContext";

type EmailLog = {
  id: string;
  recipient: string;
  sender: string;
  subject: string | null;
  body_html: string | null;
  status: string;
  direction: string;
  mailgun_message_id: string | null;
  user_id: string | null;
  campaign_id: string | null;
  sent_at: string;
};

const EmailLogsPage = () => {
  const { user, profile } = useSession();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const [filterDirection, setFilterDirection] = useState<'all' | 'outbound' | 'inbound'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'delivered' | 'failed' | 'opened' | 'received'>('all');

  const fetchEmailLogs = async () => {
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false });

    // Apply RLS logic directly in the query for non-admins
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      query = query.or(`user_id.eq.${user.id},recipient.eq.${user.email}`);
    }

    if (filterDirection !== 'all') {
      query = query.eq('direction', filterDirection);
    }
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      showError("Error fetching email logs: " + fetchError.message);
    } else {
      setEmailLogs(data as EmailLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmailLogs();
  }, [user, profile, filterDirection, filterStatus]);

  const openLogDetails = (log: EmailLog) => {
    setSelectedLog(log);
    setIsSheetOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'received':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'opened':
        return 'secondary';
      default:
        return 'outline';
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
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-5 w-1/4" />
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
    <>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Email Logs</h1>
          <p className="text-muted-foreground">View all sent and received email communications.</p>
        </div>
        <div className="flex gap-4 mb-6">
          <Select value={filterDirection} onValueChange={(value: 'all' | 'outbound' | 'inbound') => setFilterDirection(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value: 'all' | 'sent' | 'delivered' | 'failed' | 'opened' | 'received') => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="received">Received</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLogs.length > 0 ? emailLogs.map(log => (
                  <TableRow key={log.id} onClick={() => openLogDetails(log)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{log.recipient}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{log.subject || '(No Subject)'}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(log.status)}>{log.status}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{log.direction}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(log.sent_at).toLocaleString()}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No email logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Email Details</SheetTitle>
            <SheetDescription>
              Full content and metadata of the selected email.
            </SheetDescription>
          </SheetHeader>
          {selectedLog && (
            <div className="grid gap-4 py-4">
              <div>
                <p className="text-sm font-medium">From:</p>
                <p className="text-muted-foreground">{selectedLog.sender}</p>
              </div>
              <div>
                <p className="text-sm font-medium">To:</p>
                <p className="text-muted-foreground">{selectedLog.recipient}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Subject:</p>
                <p className="text-muted-foreground">{selectedLog.subject || '(No Subject)'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status:</p>
                <Badge variant={getStatusVariant(selectedLog.status)}>{selectedLog.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Direction:</p>
                <Badge variant="outline" className="capitalize">{selectedLog.direction}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Date:</p>
                <p className="text-muted-foreground">{new Date(selectedLog.sent_at).toLocaleString()}</p>
              </div>
              {selectedLog.mailgun_message_id && (
                <div>
                  <p className="text-sm font-medium">Mailgun Message ID:</p>
                  <p className="text-muted-foreground break-words">{selectedLog.mailgun_message_id}</p>
                </div>
              )}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Email Body:</p>
                <div className="border rounded-md p-4 bg-muted/20 max-h-96 overflow-y-auto">
                  {selectedLog.body_html ? (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedLog.body_html, { USE_PROFILES: { html: true } }) }} />
                  ) : (
                    <p className="text-muted-foreground italic">No HTML body available.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default EmailLogsPage;