"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, KeyRound } from "lucide-react";
import { useSession } from "@/context/SessionContextProvider"; // Use client-side supabase from context

const passwordChangeSchema = z.object({
  password: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirm_password: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match.",
  path: ["confirm_password"],
});

export function SettingsTab() {
  const { supabase } = useSession(); // Get supabase client from context
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof passwordChangeSchema>) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        toast.error(error.message);
        console.error("Password update error:", error);
        return;
      }

      toast.success("Password updated successfully!");
      form.reset(); // Clear form fields
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred during password update.");
      console.error("Unexpected password update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-xl shadow-md p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-headline-small text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Account Settings
        </CardTitle>
        <CardDescription className="text-body-medium text-muted-foreground">
          Manage your account preferences and security settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-8">
        <div className="space-y-4">
          <h3 className="text-title-large font-bold text-foreground flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" /> Change Password
          </h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="rounded-md" />
                    </FormControl>
                    <FormDescription className="text-body-small">
                      Your new password must be at least 6 characters long.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="rounded-md" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full rounded-md text-label-large" disabled={isSubmitting}>
                {isSubmitting ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </div>
        {/* Future settings can be added here */}
      </CardContent>
    </Card>
  );
}