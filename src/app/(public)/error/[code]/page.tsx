"use client"; // Explicitly mark as a Client Component

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldOff, Ban, Frown, ServerCrash } from "lucide-react";
import React from "react";

interface ErrorPageProps {
  params: Promise<{
    code: string; // Explicitly define params as a Promise to satisfy the build environment
  }>;
  searchParams?: { [key: string]: string | string[] | undefined }; // Standard prop for page components
}

// Make the component async to await the params, satisfying the type checker
export default async function ErrorPage({ params, searchParams }: ErrorPageProps) {
  // Await params to extract the code, even if it's synchronously available at runtime
  const resolvedParams = await params;
  const { code } = resolvedParams;

  let title = "Something Went Wrong";
  let message = "An unexpected error occurred. Please try again later.";
  let Icon = Frown;
  let buttonText = "Go Home";
  let buttonHref = "/";

  switch (code) {
    case "401":
      title = "Unauthorized";
      message = "You are not authorized to view this page. Please log in again.";
      Icon = ShieldOff;
      buttonText = "Login";
      buttonHref = "/login";
      break;
    case "403":
      title = "Forbidden";
      message = "You don’t have permission to access this page.";
      Icon = Ban;
      buttonText = "Contact Support";
      buttonHref = "mailto:support@globalcitizenshipfoundation.org";
      break;
    case "404":
      title = "Page Not Found";
      message = "The page you are looking for does not exist.";
      Icon = Frown;
      buttonText = "Go to Dashboard";
      buttonHref = "/";
      break;
    case "500":
      title = "Internal Server Error";
      message = "Something went wrong on our end. We're working to fix it.";
      Icon = ServerCrash;
      buttonText = "Retry";
      buttonHref = "/";
      break;
    default:
      // Use default values
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      <Icon className="h-24 w-24 text-destructive mb-6" />
      <h1 className="text-display-large font-bold mb-4">{title}</h1>
      <p className="text-headline-small text-muted-foreground mb-8 max-w-md">{message}</p>
      <Button asChild size="lg">
        <Link href={buttonHref}>
          {buttonText}
        </Link>
      </Button>
      {code === "500" && (
        <p className="text-body-medium text-muted-foreground mt-4">
          If the issue persists, please <Link href="mailto:support@globalcitizenshipfoundation.org" className="text-primary hover:underline">contact support</Link>.
        </p>
      )}
    </div>
  );
}