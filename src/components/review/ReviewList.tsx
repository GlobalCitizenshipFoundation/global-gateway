import { ApplicationReview } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AvatarWithInitials from "../common/AvatarWithInitials";

interface ReviewListProps {
  reviews: ApplicationReview[];
}

export const ReviewList = ({ reviews }: ReviewListProps) => {
  const getFullName = (review: ApplicationReview) => {
    return [review.profiles?.first_name, review.profiles?.last_name].filter(Boolean).join(' ').trim();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submitted Reviews</CardTitle>
        <CardDescription>
          {reviews.length > 0 ? "Here is the feedback from the review team." : "No reviews have been submitted for this application yet."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="p-4 border rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <AvatarWithInitials name={getFullName(review)} src={review.profiles?.avatar_url} className="h-9 w-9" />
                <div>
                  <p className="font-semibold">{getFullName(review) || 'Anonymous Reviewer'}</p>
                  <p className="text-sm text-muted-foreground">{new Date(review.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="text-lg font-bold">
                Score: <span className="text-primary">{review.score}/10</span>
              </div>
            </div>
            {review.review_scores && review.review_scores.length > 0 && (
              <div className="mt-4 pt-4 border-t">
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
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Internal Notes:</h4>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm">{review.notes || "No notes provided."}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};