"use server";

import { auth } from "../lib/auth";
import { supabaseClient } from "@/utils/supabase/client";
import { Response, MapInstance, MapInstanceCreate, MapInstanceUpdate } from "@/types";
import { headers } from "next/headers";
import { v4 as uuidv4 } from 'uuid';
import { QueryData } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

interface CreateUpdateMapInstanceInsertResponse extends Response {
  data?: MapInstance;
}

interface UpdatedMapJobInstanceFields {
  name?: string;
  visible?: boolean;
}

export async function createMapInstance(mapId: string, mapName: string): Promise<CreateUpdateMapInstanceInsertResponse> {
  let response: CreateUpdateMapInstanceInsertResponse = { success: false };
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("User Not Logged In or Invalid Session");
    }
    const userId = session.user.id;
    const mapInstanceId = uuidv4();
    let mapInstanceName = "";
    // Retreive all current map instances based on user_id and map_id
    const { data, error } = await supabaseClient.from("map_instance")
      .select("*")
      .eq("map_id", mapId)
      .eq("user_id", userId);
    if (error) {
      throw new Error(error.message);
    }
    if (!data || data.length === 0) {
      mapInstanceName = `${mapName} Copy 1`;
    }
    // TODO Need ES2018 or later to use named capture groups 
    const re = /.+ Copy (\d+)$/;
    const sortedDefaultMapNames = data.filter((val) => re.test(val.name!)).sort((a, b) => {
      const match1 = re.exec(a.name!)!;
      const match2 = re.exec(b.name!)!;
      const num1 = parseInt(match1[1]);
      const num2 = parseInt(match2[1]);
      return num1 - num2;
    });

    if (!sortedDefaultMapNames.length) {
      mapInstanceName = `${mapName} Copy 1`;
    } else {
      const copyNumber = parseInt(re.exec(sortedDefaultMapNames[sortedDefaultMapNames.length - 1].name!)![1]);
      mapInstanceName = `${mapName} Copy ${copyNumber + 1}`;
    }

    const mapInstanceData: MapInstanceCreate = {
      user_id: userId,
      map_id: mapId,
      name: mapInstanceName,
      id: mapInstanceId,
    };

    const responseInsert = supabaseClient.from("map_instance")
      .insert(mapInstanceData)
      .select(`
        *,
        user:user_id (
          name, 
          username,
          id
        )
      `)
      .single()
    type MapInstanceWithUsers = QueryData<typeof responseInsert>;
    const responseQuery = await responseInsert;
    if (responseQuery.error) {
      throw new Error(responseQuery.error.message);
    }
    const mapInstanceWithuser: MapInstanceWithUsers = responseQuery.data;
    response = { success: true, data: mapInstanceWithuser };

  } catch (error) {
    if (error instanceof Error) {
      response = { ...response, message: error.message };
    }
  } finally {
    revalidatePath("/your-creations");
    return response;
  }
}

export async function updateMapInstance(updateData: MapInstanceUpdate): Promise<CreateUpdateMapInstanceInsertResponse> {
  let response: CreateUpdateMapInstanceInsertResponse = { success: false };
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("User Not Logged In or Invalid User");
    }
    const updatedFields: UpdatedMapJobInstanceFields = {
      name: updateData.name,
      visible: updateData.visible,
    };
    const updateResponse = supabaseClient.from("map_instance")
      .update({ ...updatedFields })
      .eq("id", updateData.id)
      .eq("user_id", updateData.user_id)
      .select(`
        *,
        user:user_id (
          name, 
          username,
          id
        )
      `)
      .single()
    
    type MapInstanceWithUser = QueryData<typeof updateResponse>;
    const responseQuery = await updateResponse;
    if (responseQuery.error) {
      throw new Error(responseQuery.error.message);
    }
    const data: MapInstanceWithUser = responseQuery.data;
    response = { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      response = { ...response, message: error.message };
    }
  } finally {
    revalidatePath("/your-creations");
    return response;
  }
}

export async function deleteMapInstance(id: string): Promise<Response> {
  let response: Response = { success: false };
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("User Logged Out or Invalid User");
    }
    const deleteResponse = await supabaseClient.from("map_instance").delete()
      .eq("id", id)
      .eq("user_id", session.user.id);
    if (deleteResponse.error) {
      throw new Error(deleteResponse.error.message);
    }
    response = { success: true };
  } catch (err) {
    if (err instanceof Error) {
      response = { ...response, message: err.message };
    }
  } finally {
    revalidatePath("/your-creations");
    return response;
  }
}