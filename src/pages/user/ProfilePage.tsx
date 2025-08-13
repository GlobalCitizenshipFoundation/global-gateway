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
import { useSession } from "@/contexts/auth/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AvatarWithInitials from "@/components/common/AvatarWithInitials";
import { AccountDeletionDialog } from "@/components/common/AccountDeletionDialog";

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
  const [hasPendingDeletionRequest, setHasPendingDeletionRequest] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        const profilePromise = supabase
          .from('profiles')
          .select('first_name, middle_name, last_name, role, avatar_url')
          .eq('id', user.id)
          .single();

        const deletionRequestPromise = supabase
          .from('account_deletion_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single();

        const [{ data: profileData, error: profileError }, { data: deletionRequestData }] = await Promise.all([profilePromise, deletionRequestPromise]);

        if (profileError && profileError.code !== 'PGRST116') {
          showError("Could not fetch profile: " + profileError.message);
        } else if (profileData) {
          setFirstName(profileData.first_name || '');
          setMiddleName(profileData.middle_name || '');
          setLastName(profileData.last_name || '');
          setRole(profileData.role || 'applicant');
          setAvatarUrl(profileData.avatar_url || null);
        }
        setEmail(user.email || '');
        setHasPendingDeletionRequest(!!deletionRequestData);
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

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim() || null,
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        updated_at: now,
      })
      .eq('id', user.id);

    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim() || null,
        middle_name: middleName.trim() || null,
        last_name: lastName.trim() || null,
        full_name: fullName || null,
      }
    });

    if (profileError || userUpdateError) {
      showError("Failed to update profile: " + (profileError?.message || userUpdateError?.message));
    } else {
      showSuccess("Profile updated successfully!");
    }
    setIsSubmitting(false);
  };

  const handleRequestAccountDeletion = async () => {
    if (!user) return;
    setIsDeleteDialogOpen(false);

    const { error } = await supabase
      .from('account_deletion_requests')
      .insert({ user_id: user.id });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        showError("You already have a pending deletion request.");
      } else {
        showError(`Failed to submit request: ${error.message}`);
      }
    } else {
      showSuccess("Your account deletion request has been sent. We will contact you shortly.");
      setHasPendingDeletionRequest(true);
    }
  };

  const getFullName = () => {
    return [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
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
                  <Badge variant="secondary" className="mt-2 capitalize">{role}</Badge>
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
                <Input id="email" type="email" value={email} disabled />
                <p className="text-sm text-muted-foreground">
                  To change your email, please reach out to the admin support.
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </Button>
                <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} type="button" disabled={hasPendingDeletionRequest}>
                  {hasPendingDeletionRequest ? "Deletion Request Pending" : "Request Account Deletion"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

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
      />
    </div>
  );
};

export default ProfilePage;