"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Package, Lock, Globe } from "lucide-react";
import { Package as PackageType } from "@/features/packages/services/package-service";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getPackagesAction, deletePackageAction } from "@/features/packages/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function PackageList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<PackageType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my" | "public">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const fetchedPackages = await getPackagesAction();
      if (fetchedPackages) {
        setPackages(fetchedPackages);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load packages.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchPackages();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view packages.");
      setIsLoading(false);
    }
  }, [user, isSessionLoading]);

  useEffect(() => {
    let currentFiltered = packages;

    // Apply search term filter
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply visibility filter
    if (filter === "my" && user) {
      currentFiltered = currentFiltered.filter((pkg) => pkg.creator_id === user.id);
    } else if (filter === "public") {
      currentFiltered = currentFiltered.filter((pkg) => !pkg.is_public);
    }
    // "all" filter is handled by the initial fetch and search

    setFilteredPackages(currentFiltered);
  }, [packages, filter, searchTerm, user]);

  const handleDelete = async (id: string) => {
    try {
      const success = await deletePackageAction(id);
      if (success) {
        toast.success("Package deleted successfully!");
        fetchPackages(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete package.");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="rounded-xl shadow-md p-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-20 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const userRole: string = user?.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-display-small font-bold text-foreground">Packages</h1>
        <Button asChild className="rounded-full px-6 py-3 text-label-large">
          <Link href="/packages/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Package
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search packages by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-md"
        />
        <Select value={filter} onValueChange={(value: "all" | "my" | "public") => setFilter(value)}>
          <SelectTrigger className="w-[180px] rounded-md">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="all" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">All Packages</SelectItem>
            {user && (
              <SelectItem value="my" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">My Packages</SelectItem>
            )}
            <SelectItem value="public" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Public Packages</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredPackages.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Packages Found</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            {searchTerm ? "No packages match your search criteria." : "Start by creating your first package to group related campaigns or templates."}
          </CardDescription>
          {!searchTerm && (
            <Button asChild className="mt-6 rounded-full px-6 py-3 text-label-large">
              <Link href="/packages/new">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Package Now
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TooltipProvider>
            {filteredPackages.map((pkg) => {
              const canEditOrDelete = user && (pkg.creator_id === user.id || isAdmin);
              return (
                <Card key={pkg.id} className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-headline-small text-primary flex items-center gap-2">
                      <Package className="h-6 w-6" /> {pkg.name}
                      {pkg.is_public ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                            Public Package
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                            Private Package
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                    <CardDescription className="text-body-medium text-muted-foreground">
                      {pkg.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-body-small text-muted-foreground">
                    <p>Created: {new Date(pkg.created_at).toLocaleDateString()}</p>
                    <p>Last Updated: {new Date(pkg.updated_at).toLocaleDateString()}</p>
                  </CardContent>
                  <div className="flex justify-end p-4 pt-0 space-x-2">
                    <Button asChild variant="outlined" size="icon" className="rounded-md">
                      <Link href={`/packages/${pkg.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                    {canEditOrDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="rounded-md">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-headline-small">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-body-medium text-muted-foreground">
                              This action cannot be undone. This will permanently delete the &quot;{pkg.name}&quot; package and all its associated items.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(pkg.id)}
                              className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </Card>
              );
            })}
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}