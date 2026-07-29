"use server";

import { supabaseClient } from "@/utils/supabase/client";
import { Response } from "@/types";

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
  console.log(updatedMapName);
  const { data, error } = await supabaseClient.from("map").select("*").eq("user_id", userId).ilike("name", updatedMapName);
  console.log(data);
  if (error) {
    return { message: error.message, exists: false, success: false };
  }
  if (!data) {
    return { message: `Map With Name: ${mapName} doesn't exist`, success: true, exists: false };
  }
  return { message: `Map With Name: ${mapName} exists`, success: true, exists: true };
}