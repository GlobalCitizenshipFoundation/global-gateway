import React from "react";
import { notFound } from "next/navigation";
import { RecommenderForm } from "@/features/recommendations/components/RecommenderForm";
import { getRecommendationRequestByTokenAction } from "@/features/recommendations/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MailCheck, XCircle } from "lucide-react";

interface RecommenderPageProps {
  params: { token: string };
}

export default async function RecommenderPage({ params }: RecommenderPageProps) {
  const { token } = params;

  const request = await getRecommendationRequestByTokenAction(token);

  if (!request) {
    notFound(); // If token is invalid or request not found, return 404
  }

  const isExpired = request.status === 'overdue'; // Assuming 'overdue' status for expired requests
  const isSubmitted = request.status === 'submitted';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      {isExpired ? (
        <Card className="w-full max-w-2xl mx-auto rounded-xl shadow-lg p-6">
          <CardHeader className="p-0 mb-4">
            <XCircle className="h-24 w-24 text-destructive mx-auto mb-4" />
            <CardTitle className="text-display-small font-bold text-foreground">Recommendation Expired</CardTitle>
            <CardDescription className="text-body-large text-muted-foreground">
              We're sorry, but this recommendation request has expired. Please contact the applicant or program coordinator if you still wish to submit.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <RecommenderForm request={request} />
      )}
    </div>
  );
}