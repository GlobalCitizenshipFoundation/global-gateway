import React from "react";

    export default function AdminTestPage() {
      console.log("AdminTestPage is rendering!");
      return (
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-display-small font-bold text-foreground">Admin Test Page</h1>
          <p className="text-body-large text-muted-foreground">If you see this, the (admin) route group is working!</p>
        </div>
      );
    }