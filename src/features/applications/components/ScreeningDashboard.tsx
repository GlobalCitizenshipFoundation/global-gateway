"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Application } from "@/features/applications/services/application-service"; // Absolute import
import { getApplicationsAction, updateApplicationAction } from "@/features/applications/actions"; // Absolute import
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle2, Briefcase, Workflow, CalendarDays, CheckCircle, XCircle, Clock, MoreVertical, Trash2 } from "lucide-react"; // Added Trash2
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function ScreeningDashboard() {
  const { user, isLoading: isSessionLoading } = useSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const fetchedApplications = await getApplicationsAction();
      if (fetchedApplications) {
        setApplications(fetchedApplications);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load applications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchApplications();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view applications.");
      setIsLoading(false);
    }
  }, [user, isSessionLoading]);

  useEffect(() => {
    let currentFiltered = applications;

    if (searchTerm) {
      currentFiltered = currentFiltered.filter(
        (app) =>
          app.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.campaigns?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.screening_status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      currentFiltered = currentFiltered.filter((app) => app.screening_status === statusFilter);
    }

    if (campaignFilter !== "all") {
      currentFiltered = currentFiltered.filter((app) => app.campaign_id === campaignFilter);
    }

    setFilteredApplications(currentFiltered);
  }, [applications, searchTerm, statusFilter, campaignFilter]);

  const handleUpdateScreeningStatus = async (applicationId: string, newStatus: Application['screening_status']) => {
    try {
      const formData = new FormData();
      formData.append("screening_status", newStatus);
      const updatedApp = await updateApplicationAction(applicationId, formData);
      if (updatedApp) {
        toast.success(`Application ${updatedApp.profiles?.first_name} ${updatedApp.profiles?.last_name} screening status updated to ${newStatus}.`);
        fetchApplications();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update screening status.");
    }
  };

  const getStatusIcon = (status: Application['screening_status']) => {
    switch (status) {
      case "Accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Denied":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "On Hold":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "Pending":
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Application['screening_status']) => {
    switch (status) {
      case "Accepted": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Denied": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "On Hold": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Pending":
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
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
  const isAdminOrRecruiter = ['admin', 'coordinator', 'evaluator', 'screener'].includes(userRole);

  if (!isAdminOrRecruiter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <h1 className="text-display-medium mb-4">Access Denied</h1>
        <p className="text-headline-small text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  const uniqueCampaigns = Array.from(new Set(applications.map(app => app.campaigns)))
    .filter(Boolean)
    .map(campaign => campaign!);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-display-small font-bold text-foreground">Application Screening Dashboard</h1>
        {/* Future: Add bulk actions or quick links */}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search applicants or campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] rounded-md">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="all" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">All Statuses</SelectItem>
            <SelectItem value="Pending" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Pending</SelectItem>
            <SelectItem value="Accepted" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Accepted</SelectItem>
            <SelectItem value="On Hold" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">On Hold</SelectItem>
            <SelectItem value="Denied" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Denied</SelectItem>
          </SelectContent>
        </Select>
        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-[200px] rounded-md">
            <SelectValue placeholder="Filter by Campaign" />
          </SelectTrigger>
          <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
            <SelectItem value="all" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">All Campaigns</SelectItem>
            {uniqueCampaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredApplications.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Applications Found</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            {searchTerm || statusFilter !== "all" || campaignFilter !== "all"
              ? "No applications match your current filters."
              : "There are no applications to screen at the moment."}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <CardHeader className="flex-grow pb-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={app.profiles?.avatar_url || ""} alt={`${app.profiles?.first_name} ${app.profiles?.last_name}`} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-title-medium">
                      {app.profiles?.first_name?.charAt(0) || ""}{app.profiles?.last_name?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-title-large text-foreground">
                      {app.profiles?.first_name} {app.profiles?.last_name}
                    </CardTitle>
                    <CardDescription className="text-body-medium text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {app.campaigns?.name || "N/A Campaign"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-2 space-y-2 text-body-medium text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  Current Phase: <span className="font-medium text-foreground">{app.current_campaign_phases?.name || "N/A"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Applied: {new Date(app.created_at).toLocaleDateString()}
                </p>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${getStatusColor(app.screening_status)}`}>
                  {getStatusIcon(app.screening_status)}
                  <span className="font-medium text-body-small">Screening: {app.screening_status}</span>
                </div>
              </CardContent>
              <div className="flex justify-end p-4 pt-0 space-x-2">
                <Button asChild variant="outlined" className="rounded-md text-label-large">
                  <Link href={`/applications/${app.id}`}>View Application</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outlined" size="icon" className="rounded-md">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                    <DropdownMenuLabel className="text-body-medium">Update Screening Status</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={() => handleUpdateScreeningStatus(app.id, "Accepted")} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Accept
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateScreeningStatus(app.id, "On Hold")} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                      <Clock className="mr-2 h-4 w-4 text-yellow-600" /> On Hold
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateScreeningStatus(app.id, "Denied")} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                      <XCircle className="mr-2 h-4 w-4 text-red-600" /> Deny
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-body-medium text-destructive hover:bg-destructive-container hover:text-destructive cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Application
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-headline-small">Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription className="text-body-medium text-muted-foreground">
                            Are you sure you want to delete this application? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => { /* Implement delete action here */ toast.info("Delete functionality coming soon!"); }}
                            className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}