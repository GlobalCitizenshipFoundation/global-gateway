import { ApplicationReview } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface YourReviewCardProps {
  review: ApplicationReview;
}

export const YourReviewCard = ({ review }: YourReviewCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Submitted Review</CardTitle>
        <CardDescription>
          Submitted on {new Date(review.created_at).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-semibold">Score</p>
            <p className="text-lg font-bold text-primary">{review.score}/10</p>
          </div>
          <div>
            <p className="font-semibold">Notes</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{review.notes || "No notes provided."}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};