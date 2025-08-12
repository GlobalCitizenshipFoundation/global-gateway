import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { mockPrograms } from "../data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { showSuccess } from "@/utils/toast";
import NotFound from "./NotFound";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  essay: z.string().min(100, { message: "Essay must be at least 100 characters." }),
});

const ApplyPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const program = mockPrograms.find((p) => p.id === programId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      essay: "",
    },
  });

  if (!program) {
    return <NotFound />;
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Application Submitted:", values);
    showSuccess("Your application has been submitted successfully!");
    navigate("/");
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Apply for: {program.title}</CardTitle>
          <CardDescription>Please fill out the form below to submit your application.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="essay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Essay / Cover Letter</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself and why you're a good fit for this opportunity..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardFooter className="p-0 pt-6">
                <Button type="submit">Submit Application</Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyPage;