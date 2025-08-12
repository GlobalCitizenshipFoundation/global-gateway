import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProfilePage = () => {
  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Manage your account settings and personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" defaultValue="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="m@example.com" />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;