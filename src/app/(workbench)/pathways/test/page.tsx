import React from "react";

export default function PathwayTemplateTestPage() {
  console.log("--- PathwayTemplateTestPage is rendering! ---");
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-display-small font-bold text-foreground">Pathway Template Test Page</h1>
      <p className="text-body-medium text-muted-foreground">If you see this, static routing under /pathway-templates is working!</p>
    </div>
  );
}
</