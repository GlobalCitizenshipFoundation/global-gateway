import React from "react";

export default function PortalTestPage() {
  return (
    <div className="p-4 text-center text-foreground bg-background">
      <h1 className="text-headline-large">User Portal Test Page</h1>
      <p className="text-body-large text-muted-foreground mt-4">If you see this, the (user-portal) route group is now correctly configured and protected by the AuthenticatedLayout!</p>
    </div>
  );
}