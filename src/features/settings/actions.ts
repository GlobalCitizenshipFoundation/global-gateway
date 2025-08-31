"use server";

import {
  GlobalSetting,
  getGlobalSetting,
  updateGlobalSetting,
} from "./services/global-settings-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Helper function to check user authorization for global settings
async function authorizeAdminAction(): Promise<{ user: any; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  if (!isAdmin) {
    throw new Error("UnauthorizedAccessToGlobalSettings");
  }

  return { user, isAdmin };
}

export async function getGlobalSettingAction(key: string): Promise<GlobalSetting | null> {
  try {
    await authorizeAdminAction(); // Only admins can read global settings
    const setting = await getGlobalSetting(key);
    return setting;
  } catch (error: any) {
    console.error("Error in getGlobalSettingAction:", error.message);
    if (error.message === "UnauthorizedAccessToGlobalSettings") {
      redirect("/error/403");
    }
    redirect("/login"); // Fallback
  }
}

export async function updateGlobalSettingAction(formData: FormData): Promise<GlobalSetting | null> {
  try {
    await authorizeAdminAction(); // Only admins can update global settings

    const key = formData.get("key") as string;
    const value = JSON.parse(formData.get("value") as string || '{}');
    const description = formData.get("description") as string | null;

    if (!key) {
      throw new Error("Setting key is required.");
    }

    const updatedSetting = await updateGlobalSetting(key, value, description);

    revalidatePath("/settings/global");
    return updatedSetting;
  } catch (error: any) {
    console.error("Error in updateGlobalSettingAction:", error.message);
    if (error.message === "UnauthorizedAccessToGlobalSettings") {
      redirect("/error/403");
    }
    throw error; // Re-throw for client-side toast
  }
}