"use client";

import React from "react";
import Link from "next/link";
import { Award, LogOut, Settings, UserCircle2, Menu } from "lucide-react"; // Import Menu icon
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession } from "@/context/SessionContextProvider"; // Use client-side supabase from context
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { authService } from "@/services/auth-service"; // Removed server-only authService
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLayout } from "@/context/LayoutContext"; // Import useLayout
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile

export function Header() {
  const { session, user, isLoading, supabase } = useSession(); // Get supabase client from context
  const { toggleSidebar } = useLayout(); // Get toggleSidebar from LayoutContext
  const isMobile = useIsMobile(); // Determine if on mobile
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut(); // Use client-side supabase for signOut
      if (error) {
        console.error("Error signing out:", error.message);
        toast.error("Failed to sign out.");
        return;
      }
      toast.success("You have been signed out.");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to sign out.");
    }
  };

  const getUserInitials = (firstName: string | undefined, lastName: string | undefined) => {
    const firstInitial = firstName ? firstName.charAt(0) : '';
    const lastInitial = lastName ? lastName.charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm shadow-sm h-[var(--header-height)]">
      <div className="container mx-auto flex h-full items-center justify-between px-4">
        {/* Mobile Menu Button */}
        {isMobile && session && ( // Only show on mobile if authenticated
          <Button variant="ghost" size="icon" className="rounded-full mr-2" onClick={toggleSidebar}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        )}

        {/* Logo and App Title */}
        <Link href="/" className="flex items-center space-x-2 text-title-large font-bold text-foreground">
          <Award className="h-6 w-6 text-primary" />
          <span>Global Gateway</span>
        </Link>

        {/* Navigation and User Actions */}
        <nav className="flex items-center space-x-2">
          <ThemeToggle />

          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-muted"></div>
          ) : session && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.user_metadata?.avatar_url || ""} alt={user.user_metadata?.first_name || "User"} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-label-medium">
                      {getUserInitials(user.user_metadata?.first_name, user.user_metadata?.last_name) || <UserCircle2 className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-md shadow-lg bg-card text-card-foreground border-border" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-body-medium font-medium leading-none">
                      {user.user_metadata?.first_name || user.email}
                    </p>
                    <p className="text-body-small leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                  <div className="flex items-center"> {/* Wrap children in a single div */}
                    <UserCircle2 className="mr-2 h-4 w-4" />
                    <Link href="/profile"><span>Profile</span></Link>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                  <div className="flex items-center"> {/* Wrap children in a single div */}
                    <Settings className="mr-2 h-4 w-4" />
                    <Link href="/settings"><span>Settings</span></Link>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={handleSignOut} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                  <div className="flex items-center"> {/* Wrap children in a single div */}
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" className="rounded-full px-4 py-2">
              <Link href="/login">Login / Sign Up</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}