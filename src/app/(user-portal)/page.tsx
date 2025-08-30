// import { redirect } from "next/navigation";

export default function PortalRootPage() {
  // redirect("/portal/dashboard"); // Temporarily commented out for testing route group recognition
  return (
    <div className="p-4 text-center text-foreground bg-background">
      <h1>User Portal Root Page</h1>
      <p>This is the root of the user portal route group.</p>
    </div>
  );
}