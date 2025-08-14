import { useSession } from '@/contexts/auth/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const REVIEWER_ROLES = ['reviewer', 'lead_reviewer', 'admin', 'super_admin'];

const ReviewerProtectedRoute = () => {
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

  if (!session || !profile || !REVIEWER_ROLES.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ReviewerProtectedRoute;