"use server";

import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
} from "./services/program-service";
import { Program } from "@/features/campaigns/services/campaign-service"; // Import Program from its source of truth
import { createClient } from "@/integrations/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    // Use the service function to fetch the program
    program = await getProgramById(programId);
    if (!program) {
      throw new Error("ProgramNotFound");
    }
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

  const data = await getPrograms(); // Use the service function

  if (!data) {
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
      redirect("/error/403");
    } else if (error.message === "ProgramNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveProgram") {
      redirect("/error/500");
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
    const newProgram = await createProgram( // Use the service function
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

    const updatedProgram = await updateProgram( // Use the service function
      id,
      { name, description, start_date, end_date, status }
    );

    revalidatePath("/workbench/programs");
    revalidatePath(`/workbench/programs/${id}`);
    return updatedProgram;
  } catch (error: any) {
    console.error("Error in updateProgramAction:", error.message);
    if (error.message === "UnauthorizedToModifyProgram") {
      redirect("/error/403");
    } else if (error.message === "ProgramNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveProgram") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}

export async function deleteProgramAction(id: string): Promise<boolean> {
  try {
    await authorizeProgramAction(id, 'write'); // Authorize before delete

    const success = await deleteProgram(id); // Use the service function

    revalidatePath("/workbench/programs");
    return success;
  } catch (error: any) {
    console.error("Error in deleteProgramAction:", error.message);
    if (error.message === "UnauthorizedToModifyProgram") {
      redirect("/error/403");
    } else if (error.message === "ProgramNotFound") {
      redirect("/error/404");
    } else if (error.message === "FailedToRetrieveProgram") {
      redirect("/error/500");
    }
    redirect("/login"); // Fallback for unauthenticated or other critical errors
  }
}