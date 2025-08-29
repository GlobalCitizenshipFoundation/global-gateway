"use client";

import React, { useEffect } from "react"; // Import React
import { Button } from "@/components/ui/button";
import { Frown } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      <Frown className="h-24 w-24 text-destructive mb-6" />
      <h2 className="text-display-medium font-bold mb-4">Oops! Something went wrong.</h2>
      <p className="text-headline-small text-muted-foreground mb-8 max-w-md">
        We're sorry, but an unexpected error occurred. Please try refreshing the page or going back to the homepage.
      </p>
      <div className="flex space-x-4">
        <Button onClick={() => reset()} size="lg">
          Try again
        </Button>
        <Button asChild variant="outlined" size="lg">
          <a href="/">Go Home</a>
        </Button>
      </div>
      <p className="text-body-medium text-muted-foreground mt-4">
        If the issue persists, please contact support.
      </p>
    </div>
  );
}