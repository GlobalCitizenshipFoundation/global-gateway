import { useSession } from '@/contexts/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from './ui/skeleton';

const AdminRoute = () => {
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

  if (!session || profile?.role !== 'admin') {
    // Redirect them to the home page if they are not an admin.
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;