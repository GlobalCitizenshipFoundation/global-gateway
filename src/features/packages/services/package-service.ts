"use client";

import { createClient } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Campaign } from "@/features/campaigns/services/campaign-service";
import { PathwayTemplate } from "@/features/pathway-templates/services/pathway-template-service";

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

export const packageService = {
  supabase: createClient(),

  async getPackages(): Promise<Package[] | null> {
    const { data, error } = await this.supabase
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching packages:", error.message);
      toast.error("Failed to load packages.");
      return null;
    }
    return data;
  },

  async getPackageById(id: string): Promise<Package | null> {
    const { data, error } = await this.supabase
      .from("packages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching package ${id}:`, error.message);
      toast.error(`Failed to load package ${id}.`);
      return null;
    }
    return data;
  },

  async createPackage(
    name: string,
    description: string | null,
    is_public: boolean,
    creator_id: string
  ): Promise<Package | null> {
    const { data, error } = await this.supabase
      .from("packages")
      .insert([{ name, description, is_public, creator_id }])
      .select()
      .single();

    if (error) {
      console.error("Error creating package:", error.message);
      toast.error("Failed to create package.");
      return null;
    }
    toast.success("Package created successfully!");
    return data;
  },

  async updatePackage(
    id: string,
    updates: Partial<Omit<Package, "id" | "creator_id" | "created_at">>
  ): Promise<Package | null> {
    const { data, error } = await this.supabase
      .from("packages")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating package ${id}:`, error.message);
      toast.error("Failed to update package.");
      return null;
    }
    toast.success("Package updated successfully!");
    return data;
  },

  async deletePackage(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting package ${id}:`, error.message);
      toast.error("Failed to delete package.");
      return false;
    }
    toast.success("Package deleted successfully!");
    return true;
  },

  // --- Package Item Management ---

  async getPackageItemsByPackageId(packageId: string): Promise<PackageItem[] | null> {
    const { data, error } = await this.supabase
      .from("package_items")
      .select("*, campaigns(*), pathway_templates(*)") // Join with campaigns and pathway_templates
      .eq("package_id", packageId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error(`Error fetching package items for package ${packageId}:`, error.message);
      toast.error("Failed to load package items.");
      return null;
    }
    return data as PackageItem[];
  },

  async addPackageItem(
    packageId: string,
    itemType: 'campaign' | 'pathway_template',
    itemId: string,
    orderIndex: number
  ): Promise<PackageItem | null> {
    const { data, error } = await this.supabase
      .from("package_items")
      .insert([{ package_id: packageId, item_type: itemType, item_id: itemId, order_index: orderIndex }])
      .select("*, campaigns(*), pathway_templates(*)")
      .single();

    if (error) {
      console.error("Error adding package item:", error.message);
      toast.error("Failed to add package item.");
      return null;
    }
    toast.success("Package item added successfully!");
    return data as PackageItem;
  },

  async updatePackageItemOrder(
    id: string,
    orderIndex: number
  ): Promise<PackageItem | null> {
    const { data, error } = await this.supabase
      .from("package_items")
      .update({ order_index: orderIndex, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, campaigns(*), pathway_templates(*)")
      .single();

    if (error) {
      console.error(`Error updating package item order ${id}:`, error.message);
      toast.error("Failed to update package item order.");
      return null;
    }
    return data as PackageItem;
  },

  async removePackageItem(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("package_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error removing package item ${id}:`, error.message);
      toast.error("Failed to remove package item.");
      return false;
    }
    toast.success("Package item removed successfully!");
    return true;
  },
};