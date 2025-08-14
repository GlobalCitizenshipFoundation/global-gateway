import { useSession } from '@/contexts/auth/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react'; // Explicit React import
import { Profile } from '@/types'; // Import Profile type

const CREATOR_ROLES: Profile['role'][] = ['creator', 'admin', 'super_admin'];

const CreatorProtectedRoute = () => {
  const { session, profile, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!session || !profile || !CREATOR_ROLES.includes(profile.role)) {
    // Redirect them to the home page if they are not a creator/admin.
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default CreatorProtectedRoute;