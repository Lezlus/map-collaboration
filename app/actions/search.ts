"use server";
import { supabaseClient } from "@/utils/supabase/client";
import { Response } from "@/types";


export async function search(query: string): Promise<Response> {
  const correctedSearchResponse = await supabaseClient.rpc('correct_search_query', {
    "user_input": query
  });
  if (correctedSearchResponse.error) {
    return { success: false, message: correctedSearchResponse.error.message };
  }

  if (correctedSearchResponse.data) {
    const correctedQuery = correctedSearchResponse.data;
    const searchResponse = await supabaseClient.rpc('search_query', {
      "q": correctedQuery,
    });
    if (searchResponse.error) {
      return { success: false, message: searchResponse.error.message };
    }
    console.log(searchResponse.data);
    return { success: true };
  }
  return { success: true, message: "Success But No Data" };
}