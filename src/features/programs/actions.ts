"use server";

import { programService } from "./services/program-service";
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Program } from "@/features/campaigns/services/campaign-service"; // Corrected import path for Program

// Helper function to check user authorization for a program
async function authorizeProgramAction(programId: string, action: 'read' | 'write'): Promise<{ user: any; program: Program | null; isAdmin: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  let program: Program | null = null;
  if (programId) {
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("id", programId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found for eq filter
        throw new Error("ProgramNotFound");
      }
      console.error(`Error fetching program ${programId} for authorization:`, error.message);
      throw new Error("FailedToRetrieveProgram");
    }
    program = data;
  }

  if (!program && programId) {
    throw new Error("ProgramNotFound");
  }

  if (action === 'read') {
    // For programs, currently all authenticated users can read their own, and admins can read all.
    // RLS handles this, but we add a check here for consistency with other actions.
    if (!isAdmin && program && program.creator_id !== user.id) {
      throw new Error("UnauthorizedAccessToProgram");
    }
  } else if (action === 'write') { // For 'write' actions (create, update, delete)
    if (!isAdmin && program && program.creator_id !== user.id) {
      throw new Error("UnauthorizedToModifyProgram");
    }
  }

  return { user, program, isAdmin };
}

export async function getProgramsAction(): Promise<Program[] | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const userRole: string = user.user_metadata?.role || '';
  const isAdmin = userRole === 'admin';

  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching programs:", error.message);
    return null;
  }

  // Client-side filtering for non-admin users to ensure they only see their own programs
  const filteredData = data.filter(program => isAdmin || program.creator_id === user.id);
  return filteredData;
}

export async function getProgramByIdAction(id: string): Promise<Program | null> {
  try {
    const { program } = await authorizeProgramAction(id, 'read');
    return program;
  } catch (error: any) {
    console.error("Error in getProgramByIdAction:", error.message);
    if (error.message === "UnauthorizedAccessToProgram") {
      redirect("/error-pages/403");
    } else if (error.message === "ProgramNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveProgram") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function createProgramAction(formData: FormData): Promise<Program | null> {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const start_date = formData.get("start_date") as string | null;
  const end_date = formData.get("end_date") as string | null;
  const status = formData.get("status") as Program['status'];

  if (!name || !status) {
    throw new Error("Program name and status are required.");
  }

  try {
    const newProgram = await programService.createProgram(
      name,
      description,
      start_date,
      end_date,
      status,
      user.id
    );

    revalidatePath("/workbench/programs");
    return newProgram;
  } catch (error: any) {
    console.error("Error in createProgramAction:", error.message);
    throw error; // Re-throw to be caught by client-side toast for form errors
  }
}

export async function updateProgramAction(id: string, formData: FormData): Promise<Program | null> {
  try {
    await authorizeProgramAction(id, 'write'); // Authorize before update

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const start_date = formData.get("start_date") as string | null;
    const end_date = formData.get("end_date") as string | null;
    const status = formData.get("status") as Program['status'];

    if (!name || !status) {
      throw new Error("Program name and status are required.");
    }

    const updatedProgram = await programService.updateProgram(
      id,
      { name, description, start_date, end_date, status }
    );

    revalidatePath("/workbench/programs");
    revalidatePath(`/workbench/programs/${id}`);
    return updatedProgram;
  } catch (error: any) {
    console.error("Error in updateProgramAction:", error.message);
    if (error.message === "UnauthorizedToModifyProgram") {
      redirect("/error-pages/403");
    } else if (error.message === "ProgramNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveProgram") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function deleteProgramAction(id: string): Promise<boolean> {
  try {
    await authorizeProgramAction(id, 'write'); // Authorize before delete

    const success = await programService.deleteProgram(id);

    revalidatePath("/workbench/programs");
    return success;
  } catch (error: any) {
    console.error("Error in deleteProgramAction:", error.message);
    if (error.message === "UnauthorizedToModifyProgram") {
      redirect("/error-pages/403");
    } else if (error.message === "ProgramNotFound") {
      redirect("/error-pages/404");
    } else if (error.message === "FailedToRetrieveProgram") {
      redirect("/error-pages/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}