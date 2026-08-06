"use server";
import { FeatureCreate } from "@/types";
import { Response } from "@/types";
import { supabaseClient } from "@/utils/supabase/client";

export async function insertFeature(data: FeatureCreate): Promise<Response> {
  let response: Response = { success: false };
  try {
    const featureInsertResponse = await supabaseClient.from("feature")
    .insert(data)

    if (featureInsertResponse.error) {
      throw new Error(featureInsertResponse.error.message);
    }
    response = { success: true };
    
  } catch (err) {
    if (err instanceof Error) {
      response = { ...response, message: err.message };
    }
  } finally {
    return response;
  }
}