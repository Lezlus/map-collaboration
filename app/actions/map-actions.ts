"use server";

import { supabaseClient } from "@/utils/supabase/client";
import { Response, MapUpdate } from "@/types";
import { auth } from "../lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

interface UserMapExistsResponse extends Response {
  exists: boolean;
}

/**
 * Returns Tells you if a map name already exists by a user
 * 
 * @param mapName 
 * @param userId 
 * @returns UserMapExistsResponse
 */
export async function userMapNameExists(mapName: string, userId: string): Promise<UserMapExistsResponse> {
  // In map rows the 'name' field has an '-master' appended at the end
  const updatedMapName = mapName + "-master";
  const { data, error } = await supabaseClient.from("map").select("*").eq("user_id", userId).ilike("name", updatedMapName).single();
  if (error) {
    return { message: error.message, exists: false, success: false };
  }
  if (!data) {
    return { message: `Map With Name: ${mapName} doesn't exist`, success: true, exists: false };
  }
  return { message: `Map With Name: ${mapName} exists`, success: true, exists: true };
}

export async function updateMap(updateData: MapUpdate): Promise<Response> {
  let response: Response = { success: false };
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("User Not Logged In or Invalid User");
    }
    const updateResponse = await supabaseClient.from("map")
      .update({ name: updateData.name, description: updateData.description })
      .eq("id", updateData.id)
    if (updateResponse.error) {
      throw new Error(updateResponse.error.message);
    }
    revalidatePath("/your-creations");
    revalidatePath("/");
    response = { success: true };
  } catch (error) {
    if (error instanceof Error) {
      response = { ...response, message: error.message };
    }
  } finally {
    return response; 
  }
}