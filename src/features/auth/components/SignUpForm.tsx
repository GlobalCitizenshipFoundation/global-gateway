"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// import { authService } from "@/services/auth-service"; // Removed server-only authService
import { useSession } from "@/context/SessionContextProvider"; // Use client-side supabase from context

const signUpFormSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required." }),
  middle_name: z.string().nullable().optional(),
  last_name: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirm_password: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match.",
  path: ["confirm_password"],
});

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export function SignUpForm({ onSwitchToSignIn }: SignUpFormProps) {
  const router = useRouter();
  const { supabase } = useSession(); // Use supabase client from context

  const form = useForm<z.infer<typeof signUpFormSchema>>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signUpFormSchema>) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.first_name,
            middle_name: values.middle_name || null, // Pass null if optional middle name is empty
            last_name: values.last_name,
            role: "applicant", // Default role for new sign-ups
          },
        },
      });

      if (error) {
        toast.error(error.message);
        console.error("Sign-up error:", error);
        return;
      }

      toast.success("Account created successfully! Please check your email to confirm your account.");
      onSwitchToSignIn(); // Redirect to sign-in after successful sign-up
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred during sign-up.");
      console.error("Unexpected sign-up error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-headline-large text-center text-foreground mb-2">Create Your Account</h2>
        <p className="text-body-medium text-center text-muted-foreground mb-6">
          Fill in your details to get started.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem className="space-y-2"> {/* Added space-y-2 for better internal spacing */}
                <FormLabel className="text-label-large">First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} className="rounded-md" />
                </FormControl>
                <FormMessage className="text-body-small" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="middle_name"
            render={({ field }) => (
              <FormItem className="space-y-2"> {/* Added space-y-2 for better internal spacing */}
                <FormLabel className="text-label-large">Middle Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} className="rounded-md" value={field.value ?? ""} />
                </FormControl>
                <FormMessage className="text-body-small" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem className="space-y-2"> {/* Added space-y-2 for better internal spacing */}
              <FormLabel className="text-label-large">Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Smith" {...field} className="rounded-md" />
              </FormControl>
              <FormMessage className="text-body-small" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-2"> {/* Added space-y-2 for better internal spacing */}
              <FormLabel className="text-label-large">Email address</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} className="rounded-md" />
              </FormControl>
              <FormMessage className="text-body-small" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-2"> {/* Added space-y-2 for better internal spacing */}
              <FormLabel className="text-label-large">Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="rounded-md" />
              </FormControl>
              <FormMessage className="text-body-small" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirm_password"
          render={({ field }) => (
            <FormItem className="space-y-2"> {/* Added space-y-2 for better internal spacing */}
              <FormLabel className="text-label-large">Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="rounded-md" />
              </FormControl>
              <FormMessage className="text-body-small" />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>

        <div className="text-center text-body-medium text-muted-foreground">
          Already have an account?{" "}
          <Button variant="text" type="button" onClick={onSwitchToSignIn} className="p-0 h-auto text-primary">
            Sign In
          </Button>
        </div>
      </form>
    </Form>
  );
}