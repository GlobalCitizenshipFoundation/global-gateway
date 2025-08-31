"use server";

import { createClient } from "@/integrations/supabase/server";
import { Campaign } from "@/features/campaigns/services/campaign-service";
import { PathwayTemplate } from "@/features/pathways/services/pathway-template-service";

export interface Package {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PackageItem {
  id: string;
  package_id: string;
  item_type: 'campaign' | 'pathway_template';
  item_id: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Optional joined data for display
  campaigns?: Campaign;
  pathway_templates?: PathwayTemplate;
}

// Internal helper to get Supabase client
async function getSupabase() {
  return await createClient();
}

export async function getPackages(): Promise<Package[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching packages:", error.message);
    return null;
  }
  return data;
}

export async function getPackageById(id: string): Promise<Package | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching package ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function createPackage(
  name: string,
  description: string | null,
  is_public: boolean,
  creator_id: string
): Promise<Package | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("packages")
    .insert([{ name, description, is_public, creator_id }])
    .select()
    .single();

  if (error) {
    console.error("Error creating package:", error.message);
    return null;
  }
  return data;
}

export async function updatePackage(
  id: string,
  updates: Partial<Omit<Package, "id" | "creator_id" | "created_at">>
): Promise<Package | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("packages")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating package ${id}:`, error.message);
    return null;
  }
  return data;
}

export async function deletePackage(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("packages")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting package ${id}:`, error.message);
    return false;
  }
  return true;
}

// --- Package Item Management ---

export async function getPackageItemsByPackageId(packageId: string): Promise<PackageItem[] | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("package_items")
    .select("*, campaigns(*), pathway_templates(*)") // Join with campaigns and pathway_templates
    .eq("package_id", packageId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error(`Error fetching package items for package ${packageId}:`, error.message);
    return null;
  }
  return data as PackageItem[];
}

export async function addPackageItem(
  packageId: string,
  itemType: 'campaign' | 'pathway_template',
  itemId: string,
  orderIndex: number
): Promise<PackageItem | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("package_items")
    .insert([{ package_id: packageId, item_type: itemType, item_id: itemId, order_index: orderIndex }])
    .select("*, campaigns(*), pathway_templates(*)")
    .single();

  if (error) {
    console.error("Error adding package item:", error.message);
    return null;
  }
  return data as PackageItem;
}

export async function updatePackageItemOrder(
  id: string,
  orderIndex: number
): Promise<PackageItem | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("package_items")
    .update({ order_index: orderIndex, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, campaigns(*), pathway_templates(*)")
    .single();

  if (error) {
    console.error(`Error updating package item order ${id}:`, error.message);
    return null;
  }
  return data as PackageItem;
}

export async function removePackageItem(id: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("package_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error removing package item ${id}:`, error.message);
    return false;
  }
  return true;
}