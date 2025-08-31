"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Globe, Lock, CalendarDays, Workflow, Briefcase } from "lucide-react";
import { Campaign } from "@/features/campaigns/services/campaign-service";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getCampaignsAction, deleteCampaignAction } from "@/features/campaigns/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function CampaignList() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my" | "public">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const fetchedCampaigns = await getCampaignsAction();
      if (fetchedCampaigns) {
        setCampaigns(fetchedCampaigns);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load campaigns.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchCampaigns();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view campaigns.");
      setIsLoading(false);
    }
  }, [user, isSessionLoading]);

  useEffect(() => {
    let currentFiltered = campaigns;

    // Apply search term filter
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          campaign.pathway_templates?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply visibility filter
    if (filter === "my" && user) {
      currentFiltered = currentFiltered.filter((campaign) => campaign.creator_id === user.id);
    } else if (filter === "public") {
      currentFiltered = currentFiltered.filter((campaign) => campaign.is_public);
    }
    // "all" filter is handled by the initial fetch and search

    setFilteredCampaigns(currentFiltered);
  }, [campaigns, filter, searchTerm, user]);

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteCampaignAction(id);
      if (success) {
        toast.success("Campaign deleted successfully!");
        fetchCampaigns(); // Refresh the list
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete campaign.");
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
        <h1 className="text-display-small font-bold text-foreground">Campaigns</h1>
        <Button asChild className="rounded-full px-6 py-3 text-label-large">
          <Link href="/campaigns/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Campaign
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search campaigns by name, description, or template..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-md"
        />
        <Select value={filter} onValueChange={(value: "all" | "my" | "public") => setFilter(value)}>
          <SelectTrigger className="w-[180px] rounded-md">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="all" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">All Campaigns</SelectItem>
            {user && (
              <SelectItem value="my" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">My Campaigns</SelectItem>
            )}
            <SelectItem value="public" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Public Campaigns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCampaigns.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Campaigns Found</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            {searchTerm ? "No campaigns match your search criteria." : "Start by creating your first campaign to launch a program."}
          </CardDescription>
          {!searchTerm && (
            <Button asChild className="mt-6 rounded-full px-6 py-3 text-label-large">
              <Link href="/campaigns/new">
                <PlusCircle className="mr-2 h-5 w-5" /> Create Campaign Now
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TooltipProvider>
            {filteredCampaigns.map((campaign) => {
              const canEditOrDelete = user && (campaign.creator_id === user.id || isAdmin);
              return (
                <Card key={campaign.id} className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-headline-small text-primary flex items-center gap-2">
                      <Briefcase className="h-6 w-6" /> {campaign.name}
                      {campaign.is_public ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                            Public Campaign
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                            Private Campaign
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                    <CardDescription className="text-body-medium text-muted-foreground">
                      {campaign.description || "No description provided."}
                    </CardDescription>
                    {campaign.pathway_template_id && campaign.pathway_templates?.name && (
                      <p className="text-body-small text-muted-foreground flex items-center gap-1 mt-2">
                        <Workflow className="h-4 w-4" />
                        Template: <Link href={`/pathways/${campaign.pathway_template_id}`} className="text-primary hover:underline">
                          {campaign.pathway_templates.name}
                        </Link>
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="text-body-small text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      Start: {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : "N/A"}
                    </p>
                    <p className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      End: {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : "N/A"}
                    </p>
                    <p>Status: <span className="font-medium capitalize">{campaign.status}</span></p>
                  </CardContent>
                  <div className="flex justify-end p-4 pt-0 space-x-2">
                    <Button asChild variant="outline" size="icon" className="rounded-md">
                      <Link href={`/campaigns/${campaign.id}/edit`}>
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
                              This action cannot be undone. This will permanently delete the &quot;{campaign.name}&quot; campaign.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(campaign.id)}
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