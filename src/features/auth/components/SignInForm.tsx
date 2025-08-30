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
import { authService } from "@/services/auth-service";
import { useSession } from "@/context/SessionContextProvider";

const signInFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}

export function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const router = useRouter();
  const { supabase } = useSession(); // Use supabase client from context

  const form = useForm<z.infer<typeof signInFormSchema>>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signInFormSchema>) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error(error.message);
        console.error("Sign-in error:", error);
        return;
      }

      toast.success("Signed in successfully!");

      // Explicitly refresh the router to re-run middleware and re-fetch server components.
      // The middleware will then handle the redirection based on the user's role.
      router.refresh();

      // IMPORTANT: Removed client-side router.push() calls here.
      // The middleware is now solely responsible for redirecting after login.

    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred during sign-in.");
      console.error("Unexpected sign-in error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h2 className="text-headline-large text-center text-foreground mb-2">Sign In to Your Account</h2>
        <p className="text-body-medium text-center text-muted-foreground mb-6">
          Enter your details below to access your account.
        </p>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-2">
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
            <FormItem className="space-y-2">
              <FormLabel className="text-label-large">Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="rounded-md" />
              </FormControl>
              <FormMessage className="text-body-small" />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full rounded-md text-label-large" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
        </Button>

        <div className="text-center text-body-medium text-muted-foreground">
          Don't have an account?{" "}
          <Button variant="text" type="button" onClick={onSwitchToSignUp} className="p-0 h-auto text-primary">
            Sign Up
          </Button>
        </div>
      </form>
    </Form>
  );
}