"use server";
import { supabaseClient } from "@/utils/supabase/client";
import { Response } from "@/types";
import { PublishedMap, MapInstance } from "@/types";

interface SearchResponse extends Response {
  publishedMaps: PublishedMap[];
  mapInstances: MapInstance[];
}

export async function search(query: string): Promise<SearchResponse> {
  const publishedMaps: PublishedMap[] = [];
  const mapInstances: MapInstance[] = [];
  let response: SearchResponse = { success: false, publishedMaps, mapInstances };
  try {
    const correctedSearchResponse = await supabaseClient.rpc('correct_search_query', {
        "user_input": query
    });
    if (correctedSearchResponse.error) {
      throw new Error(correctedSearchResponse.error.message);
    }
    if (correctedSearchResponse.data) {
      const correctedQuery = correctedSearchResponse.data;
      const searchResponse = await supabaseClient.rpc('search_query', {
        "q": correctedQuery,
      });
      if (searchResponse.error) {
        throw new Error(searchResponse.error.message);
      }
      await Promise.all(searchResponse.data.map(async (row) => {
        if (row.type === "map") {
          const mapResponse = await supabaseClient.from("map").select(`
            id,
            manifest_path,
            img_thumbnail_path,
            official,
            description,
            name,
            user_id,
            createdAt,
            updatedAt,
            user:user_id (
              name,
              username,
              id
            )
          `)
          .eq("id", row.id)
          .single();
          if (mapResponse.data) {
            const data: PublishedMap = mapResponse.data;
            publishedMaps.push(data);
          }
        } else {
          const mapInstanceResponse = await supabaseClient.from("map_instance").select(`
            id,
            user_id,
            map_id,
            visible,
            name,
            createdAt,
            updatedAt,
            user:user_id (
              name,
              username,
              id
            )
          `)
          .eq("id", row.id)
          .single();
          if (mapInstanceResponse.data) {
            const data: MapInstance = mapInstanceResponse.data;
            mapInstances.push(data);
          }
        }
      }));
      response = { ...response, success: true };
    }
  } catch (e) {
    if (e instanceof Error) {
      response = { ...response, message: e.message };
    }
  } finally {
    return response;
  }
  
}