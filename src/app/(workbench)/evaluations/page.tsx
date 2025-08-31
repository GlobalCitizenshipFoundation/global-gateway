import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EvaluationsDashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <Award className="h-7 w-7 text-primary" /> Evaluations Dashboard
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            Overview of all evaluation activities and reviewer assignments.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground">
          <p>This dashboard will provide a comprehensive view of all ongoing and completed reviews.</p>
          <p className="mt-2">Coming soon: Metrics, reviewer workload, and assignment management tools.</p>
          <div className="mt-6">
            <Button asChild variant="tonal" className="rounded-md">
              <Link href="/evaluations/my-reviews">Go to My Reviews</Link> {/* Corrected link */}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}