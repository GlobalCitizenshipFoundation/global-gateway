import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ReviewerDashboardPage = () => {
  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Reviewer Dashboard</h1>
          <p className="text-muted-foreground">Here are the applications assigned to you for review.</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assigned Applications</CardTitle>
          <CardDescription>
            Select an application to begin your review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center h-48 flex items-center justify-center">
            <p className="text-muted-foreground">You have no applications assigned to you at this time.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewerDashboardPage;