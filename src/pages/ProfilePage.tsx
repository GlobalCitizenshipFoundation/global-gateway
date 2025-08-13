import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AvatarWithInitials from "@/components/AvatarWithInitials";
import { AccountDeletionDialog } from "@/components/AccountDeletionDialog";

const ProfilePage = () => {
  const { user } = useSession();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'applicant' | 'creator' | 'admin'>('applicant');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, middle_name, last_name, role, avatar_url, email') // Fetch email directly
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignore error for no rows found
          showError("Could not fetch profile: " + error.message);
        } else if (data) {
          setFirstName(data.first_name || '');
          setMiddleName(data.middle_name || '');
          setLastName(data.last_name || '');
          setRole(data.role || 'applicant');
          setAvatarUrl(data.avatar_url || null);
          setEmail(data.email || user.email || ''); // Use email from profile, fallback to auth.user.email
        } else {
          setEmail(user.email || ''); // If no profile yet, use auth.user.email
        }
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const now = new Date().toISOString();

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim() || null,
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        updated_at: now,
        email: email.trim() || null, // Update email in profile as well
      })
      .eq('id', user.id);

    // Update user_metadata in auth.users for immediate session consistency
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim() || null,
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        full_name: fullName || null, // Keep full_name in metadata for convenience
      },
      email: email.trim() || undefined, // Allow updating email via auth.updateUser
    });

    if (profileError || userUpdateError) {
      showError("Failed to update profile: " + (profileError?.message || userUpdateError?.message));
    } else {
      showSuccess("Profile updated successfully!");
    }
    setIsSubmitting(false);
  };

  const handleRequestAccountDeletion = async () => {
    if (!user) {
      showError("You must be logged in to request account deletion.");
      return;
    }
    setIsRequestingDeletion(true);

    // Check if a request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('account_deletion_requests')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is good
      showError("Could not check for existing deletion requests: " + checkError.message);
      setIsRequestingDeletion(false);
      return;
    }

    if (existingRequest) {
      showError("You already have a pending account deletion request.");
      setIsRequestingDeletion(false);
      setIsDeleteDialogOpen(false);
      return;
    }

    // Insert a new request
    const { error } = await supabase
      .from('account_deletion_requests')
      .insert({ user_id: user.id });

    if (error) {
      showError("Failed to submit deletion request: " + error.message);
    } else {
      showSuccess("Your account deletion request has been sent. We will process it shortly.");
    }
    setIsRequestingDeletion(false);
    setIsDeleteDialogOpen(false);
  };

  const getFullName = () => {
    return [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
  };

  const getRoleLabel = (role: 'applicant' | 'creator' | 'admin') => {
    switch (role) {
      case 'applicant':
        return 'Applicant';
      case 'creator':
        return 'Program Creator';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your account settings and personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-6">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          ) : (
            <form className="grid gap-6" onSubmit={handleUpdateProfile}>
              <div className="flex items-center gap-4">
                <AvatarWithInitials name={getFullName()} src={avatarUrl} className="h-20 w-20" />
                <div>
                  <h3 className="text-xl font-semibold">{getFullName() || 'No Name Set'}</h3>
                  <p className="text-muted-foreground text-sm">{email}</p>
                  <Badge variant="secondary" className="mt-2">{getRoleLabel(role)}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isSubmitting} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="middle-name">Middle Name (Optional)</Label>
                  <Input id="middle-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} disabled={isSubmitting} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isSubmitting} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                <p className="text-sm text-muted-foreground">
                  You can update your email here.
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </Button>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} type="button">
                  Request Account Deletion
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Moved outside the card for subtlety */}
      {!loading && (
        <div className="mx-auto max-w-xl mt-8 text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="font-medium">Account Creation Date:</span>
            <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Last Login Date:</span>
            <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</span>
          </div>
        </div>
      )}

      <AccountDeletionDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleRequestAccountDeletion}
        isSubmitting={isRequestingDeletion}
      />
    </div>
  );
};

export default ProfilePage;