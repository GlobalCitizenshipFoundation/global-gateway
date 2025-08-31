"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, Package as PackageIcon, Lock, Globe, Edit, GripVertical, Trash2, Workflow, Briefcase } from "lucide-react";
import { Package as PackageType, PackageItem } from "@/features/packages/services/package-service";
import { toast } from "sonner";
import { useSession } from "@/context/SessionContextProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { getPackageByIdAction, getPackageItemsAction, addPackageItemAction, updatePackageItemOrderAction, removePackageItemAction } from "@/features/packages/actions";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getCampaignsAction } from "@/features/campaigns/actions";
import { getTemplatesAction } from "@/features/pathways/actions";
import { Campaign } from "@/features/campaigns/services/campaign-service";
import { PathwayTemplate } from "@/features/pathways/services/pathway-template-service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation"; // Added this import

const addItemFormSchema = z.object({
  itemType: z.enum(["campaign", "pathway_template"], { message: "Item type is required." }),
  itemId: z.string().uuid("Invalid item ID.").min(1, "Item selection is required."),
});

interface PackageDetailProps {
  packageId: string;
}

export function PackageDetail({ packageId }: PackageDetailProps) {
  const router = useRouter();
  const { user, isLoading: isSessionLoading } = useSession();
  const [pkg, setPkg] = useState<PackageType | null>(null);
  const [packageItems, setPackageItems] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<PathwayTemplate[]>([]);
  const [isItemsLoading, setIsItemsLoading] = useState(true);

  const addItemForm = useForm<z.infer<typeof addItemFormSchema>>({
    resolver: zodResolver(addItemFormSchema),
    defaultValues: {
      itemType: "campaign",
      itemId: "",
    },
  });

  const fetchPackageAndItems = async () => {
    setIsLoading(true);
    try {
      const fetchedPackage = await getPackageByIdAction(packageId);
      if (!fetchedPackage) {
        toast.error("Package not found or unauthorized.");
        router.push("/packages");
        return;
      }
      setPkg(fetchedPackage);

      const fetchedItems = await getPackageItemsAction(packageId);
      if (fetchedItems) {
        setPackageItems(fetchedItems);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load package details.");
      router.push("/packages");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableItems = async () => {
    setIsItemsLoading(true);
    try {
      const campaigns = await getCampaignsAction();
      if (campaigns) setAvailableCampaigns(campaigns);

      const templates = await getTemplatesAction();
      if (templates) setAvailableTemplates(templates);
    } catch (error: any) {
      console.error("Failed to fetch available items:", error);
      toast.error("Failed to load available campaigns/templates.");
    } finally {
      setIsItemsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionLoading && user) {
      fetchPackageAndItems();
      fetchAvailableItems();
    } else if (!isSessionLoading && !user) {
      toast.error("You must be logged in to view packages.");
      router.push("/login");
    }
  }, [user, isSessionLoading, packageId]);

  const handleAddItem = async (values: z.infer<typeof addItemFormSchema>) => {
    try {
      const formData = new FormData();
      formData.append("item_type", values.itemType);
      formData.append("item_id", values.itemId);
      formData.append("order_index", packageItems.length.toString());

      const newItem = await addPackageItemAction(
        packageId,
        formData
      );
      if (newItem) {
        toast.success("Item added to package successfully!");
        setIsAddItemDialogOpen(false);
        addItemForm.reset({ itemType: "campaign", itemId: "" });
        fetchPackageAndItems(); // Re-fetch to update list
      }
    } catch (error: any) {
      console.error("Add item error:", error);
      toast.error(error.message || "Failed to add item to package.");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const success = await removePackageItemAction(itemId, packageId);
      if (success) {
        toast.success("Item removed from package successfully!");
        fetchPackageAndItems(); // Re-fetch to update list
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove item from package.");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedItems = Array.from(packageItems);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    setPackageItems(updatedItems); // Optimistic update

    try {
      const success = await updatePackageItemOrderAction(
        packageId,
        updatedItems.map((item) => ({ id: item.id, order_index: item.order_index }))
      );
      if (!success) {
        toast.error("Failed to reorder package items. Reverting changes.");
        fetchPackageAndItems(); // Revert on failure
      } else {
        toast.success("Package items reordered successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder package items. Reverting changes.");
      fetchPackageAndItems(); // Revert on failure
    }
  };

  if (isLoading || !pkg) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48 mb-4" />
        <Card className="rounded-xl shadow-md p-6">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-20 w-full mb-4" />
        </Card>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="rounded-xl shadow-md p-4 flex items-center">
              <Skeleton className="h-5 w-5 mr-4" />
              <div className="flex-grow">
                <Skeleton className="h-6 w-2/3 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md ml-4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const currentUser = user!;
  const currentPackage = pkg!;

  const userRole: string = currentUser.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';
  const canModifyPackage: boolean = currentPackage.creator_id === currentUser.id || isAdmin;

  const selectedItemType = addItemForm.watch("itemType");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-label-large">
          <Link href="/packages">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Packages
          </Link>
        </Button>
        <div className="flex space-x-2">
          {canModifyPackage && (
            <Button asChild className="rounded-full px-6 py-3 text-label-large">
              <Link href={`/packages/${currentPackage.id}/edit`}>
                <Edit className="mr-2 h-5 w-5" /> Edit Package Details
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-xl shadow-lg p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-display-small font-bold text-foreground flex items-center gap-2">
            <PackageIcon className="h-7 w-7 text-primary" /> {currentPackage.name}
            <TooltipProvider>
              {currentPackage.is_public ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                    Public Package
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="rounded-md shadow-lg bg-card text-card-foreground border-border text-body-small">
                    Private Package
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-body-large text-muted-foreground">
            {currentPackage.description || "No description provided for this package."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-body-medium text-muted-foreground">
          <p>Created: {new Date(currentPackage.created_at).toLocaleDateString()}</p>
          <p>Last Updated: {new Date(currentPackage.updated_at).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-8">
        <h2 className="text-headline-large font-bold text-foreground">Package Items</h2>
        {canModifyPackage && (
          <Button onClick={() => setIsAddItemDialogOpen(true)} className="rounded-full px-6 py-3 text-label-large">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Item
          </Button>
        )}
      </div>

      {packageItems.length === 0 ? (
        <Card className="rounded-xl shadow-md p-8 text-center">
          <CardTitle className="text-headline-small text-muted-foreground mb-4">No Items in this Package</CardTitle>
          <CardDescription className="text-body-medium text-muted-foreground">
            {canModifyPackage ? "Add campaigns or pathway templates to this package." : "This package currently contains no items."}
          </CardDescription>
          {canModifyPackage && (
            <Button onClick={() => setIsAddItemDialogOpen(true)} className="mt-6 rounded-full px-6 py-3 text-label-large">
              <PlusCircle className="mr-2 h-5 w-5" /> Add First Item
            </Button>
          )}
        </Card>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="package-items">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {packageItems.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`rounded-xl shadow-md transition-all duration-200 ${
                          snapshot.isDragging ? "shadow-lg ring-2 ring-primary-container" : "hover:shadow-lg"
                        } flex items-center p-4`}
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab p-2 -ml-2 mr-2 text-muted-foreground hover:text-foreground transition-colors">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <CardHeader className="flex-grow p-0">
                          <CardTitle className="text-title-medium text-foreground flex items-center gap-2">
                            {item.item_type === 'campaign' && <Briefcase className="h-5 w-5 text-secondary" />}
                            {item.item_type === 'pathway_template' && <Workflow className="h-5 w-5 text-tertiary" />}
                            {item.item_type === 'campaign' ? item.campaigns?.name : item.pathway_templates?.name}
                          </CardTitle>
                          <CardDescription className="text-body-small text-muted-foreground">
                            {item.item_type === 'campaign' ? item.campaigns?.description : item.pathway_templates?.description}
                          </CardDescription>
                          <p className="text-body-small text-muted-foreground mt-1 capitalize">
                            Type: {item.item_type.replace('_', ' ')}
                          </p>
                        </CardHeader>
                        <CardContent className="flex-shrink-0 flex items-center space-x-2 p-0 pl-4">
                          {canModifyPackage && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="rounded-md">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Remove Item</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-xl shadow-lg bg-card text-card-foreground border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-headline-small">Confirm Removal</AlertDialogTitle>
                                  <AlertDialogDescription className="text-body-medium text-muted-foreground">
                                    Are you sure you want to remove &quot;{item.item_type === 'campaign' ? item.campaigns?.name : item.pathway_templates?.name}&quot; from this package? This will not delete the original item.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-md text-label-large">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="rounded-md text-label-large bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-xl shadow-lg bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-headline-small">Add Item to Package</DialogTitle>
            <DialogDescription className="text-body-medium text-muted-foreground">
              Select a campaign or pathway template to add to this package.
            </DialogDescription>
          </DialogHeader>
          <Form {...addItemForm}>
            <form onSubmit={addItemForm.handleSubmit(handleAddItem)} className="grid gap-4 py-4">
              <FormField
                control={addItemForm.control}
                name="itemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Item Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isItemsLoading}>
                      <FormControl>
                        <SelectTrigger className="rounded-md">
                          <SelectValue placeholder={isItemsLoading ? "Loading items..." : `Select a ${selectedItemType}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                        <SelectItem value="campaign" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Campaign</SelectItem>
                        <SelectItem value="pathway_template" className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">Pathway Template</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addItemForm.control}
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label-large">Select Item</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isItemsLoading}>
                      <FormControl>
                        <SelectTrigger className="rounded-md">
                          <SelectValue placeholder={isItemsLoading ? "Loading items..." : `Select a ${selectedItemType}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-md shadow-lg bg-card text-card-foreground border-border">
                        {selectedItemType === "campaign" ? (
                          availableCampaigns.length === 0 ? (
                            <SelectItem value="no-campaigns" disabled className="text-body-medium text-muted-foreground">No campaigns available.</SelectItem>
                          ) : (
                            availableCampaigns.map((campaign: Campaign) => (
                              <SelectItem key={campaign.id} value={campaign.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                {campaign.name}
                              </SelectItem>
                            ))
                          )
                        ) : (
                          availableTemplates.length === 0 ? (
                            <SelectItem value="no-templates" disabled className="text-body-medium text-muted-foreground">No pathway templates available.</SelectItem>
                          ) : (
                            availableTemplates.map((template: PathwayTemplate) => (
                              <SelectItem key={template.id} value={template.id} className="text-body-medium hover:bg-muted hover:text-muted-foreground cursor-pointer">
                                {template.name}
                              </SelectItem>
                            ))
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outlined" onClick={() => setIsAddItemDialogOpen(false)} className="rounded-md text-label-large">
                  Cancel
                </Button>
                <Button type="submit" className="rounded-md text-label-large" disabled={addItemForm.formState.isSubmitting || isItemsLoading}>
                  {addItemForm.formState.isSubmitting ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}