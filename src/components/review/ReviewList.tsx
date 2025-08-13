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
            <p className="text-muted-foreground whitespace-pre-wrap">{review.notes || "No notes provided."}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};