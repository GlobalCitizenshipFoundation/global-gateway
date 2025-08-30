"use client";

import React from "react";

export default function PortalTestPage() {
  console.log("[Dyad Debug] PortalTestPage is rendering!");
  return (
    <div className="p-4 text-center text-foreground bg-background">
      <h1>User Portal Test Page - Direct Access</h1>
      <p>If you see this, the /user-portal route group is working!</p>
    </div>
  );
}