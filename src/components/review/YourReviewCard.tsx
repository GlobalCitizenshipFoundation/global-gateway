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
            <p className="font-semibold">Overall Score</p>
            <p className="text-lg font-bold text-primary">{review.score}/10</p>
          </div>
          {review.review_scores && review.review_scores.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Detailed Scores:</h4>
              <dl className="space-y-2">
                {review.review_scores.map(score => (
                  <div key={score.id} className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">{score.evaluation_criteria?.label || 'Criterion'}</dt>
                    <dd className="font-medium">{score.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="pt-4 border-t">
            <p className="font-semibold">Internal Notes</p>
            <p className="text-muted-foreground whitespace-pre-wrap text-sm">{review.notes || "No notes provided."}</p>
          </div>
          <div className="pt-4 border-t">
            <p className="font-semibold">Shared Feedback</p>
            <p className="text-muted-foreground whitespace-pre-wrap text-sm">{review.shared_feedback || "No shared feedback provided."}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};