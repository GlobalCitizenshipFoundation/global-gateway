import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApplicantInfoCardProps {
  fullName: string;
  email: string;
}

export const ApplicantInfoCard = ({ fullName, email }: ApplicantInfoCardProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Your Information</CardTitle>
        <CardDescription>This information is pre-filled from your account.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="applicant-full-name">Full Name</Label>
          <Input id="applicant-full-name" value={fullName} disabled />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="applicant-email">Email</Label>
          <Input id="applicant-email" type="email" value={email} disabled />
        </div>
      </CardContent>
    </Card>
  );
};