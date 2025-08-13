import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviewerDashboardData } from "@/hooks/reviewer/useReviewerDashboardData";
import { AssignedApplicationsTable } from "@/components/reviewer/AssignedApplicationsTable";

const ReviewerDashboardPage = () => {
  const { assignments, loading, error } = useReviewerDashboardData();

  if (loading) {
    return (
      <div className="container py-12">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-9 w-24" />
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
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reviewer Dashboard</h1>
        <p className="text-muted-foreground">Here are the applications assigned to you for review.</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <AssignedApplicationsTable assignments={assignments} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewerDashboardPage;