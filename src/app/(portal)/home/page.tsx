import React from "react";

export default function PortalHomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <h1 className="text-display-medium mb-4">Portal Home Test Page</h1>
      <p className="text-headline-small text-muted-foreground">If you see this, the route is working!</p>
    </div>
  );
}