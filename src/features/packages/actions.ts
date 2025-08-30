"use server";

import { packageService, Package, PackageItem } from "@/features/packages/services/package-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { campaignService } from "@/features/campaigns/services/campaign-service";
import { pathwayTemplateService } from "@/features/pathway-templates/services/pathway-template-service";

// Helper function to check user authorization for a package
async function authorizePackageAction(packageId: string | null, action: 'read' | 'write'): Promise<{ user: any; package: Package | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let pkg: Package | null = null;
  if (packageId) {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("id", packageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found for eq filter
        throw new Error("PackageNotFound");
      }
      console.error(`Error fetching package ${packageId} for authorization:`, error.message);
      throw new Error("FailedToRetrievePackage");
    }
    pkg = data;
  }

  if (!pkg && packageId) {
    throw new Error("PackageNotFound");
  }

  if (action === 'read') {
    if (!isAdmin && pkg && pkg.is_public && pkg.creator_id !== user.id) {
      throw new Error("UnauthorizedAccessToPrivatePackage");
    }
  } else if (action === 'write') { // For 'write' actions (create, update, delete, add/remove items)
    if (!isAdmin && pkg && pkg.creator_id !== user.id) {
      throw new Error("UnauthorizedToModifyPackage");
    }
  }

  return { user, package: pkg, isAdmin };
}

export async function getPackagesAction(): Promise<Package[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching packages:", error.message);
    return null;
  }

  const filteredData = data.filter(pkg => isAdmin || pkg.creator_id === user.id || !pkg.is_public);
  return filteredData;
}

export async function getPackageByIdAction(id: string): Promise<Package | null> {
  try {
    const { package: pkg } = await authorizePackageAction(id, 'read');
    return pkg;
  } catch (error: any) {
    console.error("Error in getPackageByIdAction:", error.message);
    if (error.message === "UnauthorizedAccessToPrivatePackage") {
      redirect("/error/403");
    } else if (error.message === "PackageNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrievePackage") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function createPackageAction(formData: FormData): Promise<Package | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const is_public = formData.get("is_public") === "on";

  if (!name) {
    throw new Error("Package name is required.");
  }

  try {
    const newPackage = await packageService.createPackage(
      name,
      description,
      is_public,
      user.id
    );

    revalidatePath("/workbench/packages");
    return newPackage;
  } catch (error: any) {
    console.error("Error in createPackageAction:", error.message);
    throw error; // Re-throw to be caught by client-side toast for form errors
  }
}

export async function updatePackageAction(id: string, formData: FormData): Promise<Package | null> {
  try {
    await authorizePackageAction(id, 'write'); // Authorize before update

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const is_public = formData.get("is_public") === "on";

    if (!name) {
      throw new Error("Package name is required.");
    }

    const updatedPackage = await packageService.updatePackage(
      id,
      { name, description, is_public }
    );

    revalidatePath("/workbench/packages");
    revalidatePath(`/workbench/packages/${id}`);
    return updatedPackage;
  } catch (error: any) {
    console.error("Error in updatePackageAction:", error.message);
    if (error.message === "UnauthorizedToModifyPackage") {
      redirect("/error/403");
    } else if (error.message === "PackageNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrievePackage") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function deletePackageAction(id: string): Promise<boolean> {
  try {
    await authorizePackageAction(id, 'write'); // Authorize before delete

    const success = await packageService.deletePackage(id);

    revalidatePath("/workbench/packages");
    return success;
  } catch (error: any) {
    console.error("Error in deletePackageAction:", error.message);
    if (error.message === "UnauthorizedToModifyPackage") {
      redirect("/error/403");
    } else if (error.message === "PackageNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrievePackage") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

// --- Package Item Management Server Actions ---

export async function getPackageItemsAction(packageId: string): Promise<PackageItem[] | null> {
  try {
    await authorizePackageAction(packageId, 'read'); // User must have read access to the parent package
    const items = await packageService.getPackageItemsByPackageId(packageId);
    return items;
  } catch (error: any) {
    console.error("Error in getPackageItemsAction:", error.message);
    if (error.message === "UnauthorizedAccessToPrivatePackage") {
      redirect("/error/403");
    } else if (error.message === "PackageNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrievePackage") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function addPackageItemAction(packageId: string, formData: FormData): Promise<PackageItem | null> {
  try {
    await authorizePackageAction(packageId, 'write'); // User must have write access to the parent package

    const item_type = formData.get("item_type") as 'campaign' | 'pathway_template';
    const item_id = formData.get("item_id") as string;
    const order_index = parseInt(formData.get("order_index") as string);

    if (!item_type || !item_id || isNaN(order_index)) {
      throw new Error("Item type, ID, and order index are required.");
    }

    // Optional: Further validation to ensure item_id actually exists and is accessible
    if (item_type === 'campaign') {
      const campaign = await campaignService.getCampaignById(item_id);
      if (!campaign) throw new Error("Campaign not found or unauthorized.");
    } else if (item_type === 'pathway_template') {
      const template = await pathwayTemplateService.getPathwayTemplateById(item_id);
      if (!template) throw new Error("Pathway Template not found or unauthorized.");
    }

    const newItem = await packageService.addPackageItem(
      packageId,
      item_type,
      item_id,
      order_index
    );

    revalidatePath(`/workbench/packages/${packageId}`);
    return newItem;
  } catch (error: any) {
    console.error("Error in addPackageItemAction:", error.message);
    if (error.message === "UnauthorizedToModifyPackage") {
      redirect("/error/403");
    } else if (error.message === "PackageNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrievePackage") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast for form errors
  }
}

export async function updatePackageItemOrderAction(packageId: string, items: { id: string; order_index: number }[]): Promise<boolean> {
  try {
    await authorizePackageAction(packageId, 'write'); // User must have write access to the parent package

    for (const item of items) {
      await packageService.updatePackageItemOrder(item.id, item.order_index);
    }

    revalidatePath(`/workbench/packages/${packageId}`);
    return true;
  } catch (error: any) {
    console.error("Error in updatePackageItemOrderAction:", error.message);
    if (error.message === "UnauthorizedToModifyPackage") {
      redirect("/error/403");
    } else if (error.message === "PackageNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrievePackage") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}

export async function removePackageItemAction(itemId: string, packageId: string): Promise<boolean> {
  try {
    await authorizePackageAction(packageId, 'write'); // User must have write access to the parent package

    const success = await packageService.removePackageItem(itemId);

    revalidatePath(`/workbench/packages/${packageId}`);
    return success;
  } catch (error: any) {
    console.error("Error in removePackageItemAction:", error.message);
    if (error.message === "UnauthorizedToModifyPackage") {
      redirect("/error/403");
    } else if (error.message === "PackageNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrievePackage") {
      redirect("/error/500");
    }
    throw error; // Re-throw to be caught by client-side toast
  }
}