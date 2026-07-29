"use server";
import { Response, PublishedMap, MapInstance } from "@/types";
import { supabaseClient } from "@/utils/supabase/client";
import { QueryData } from "@supabase/supabase-js";

interface UserPublishedMapsResponse extends Response {
  maps?: PublishedMap[];
}

interface UserMapInstanceResponse extends Response {
  map_instances?: MapInstance[];
}

interface SimpleUser {
  name: string | null;
  username: string | null;
  id: string;
}

interface SimpleUserResponse extends Response {
  user?: SimpleUser
}

export async function getUserPublishedMaps(userId: string): Promise<UserPublishedMapsResponse> {
  const publishedMapWithUsersQuery = supabaseClient.from("map").select(`
    *,
    user:user_id (
      name,
      username,
      id
    )
  `).eq("user_id", userId);
  type PublishedMapWithUsersType = QueryData<typeof publishedMapWithUsersQuery>;

  const { data, error } = await publishedMapWithUsersQuery;
  if (error) {
    return { message: error.message, success: false };
  }

  if (!data) {
    return { message: "No Published Maps", success: true };
  }
  const publishedMapWithUsers: PublishedMapWithUsersType = data;

  return { success: true, maps: publishedMapWithUsers }
}

export async function getUserMapInstances(userId: string): Promise<UserMapInstanceResponse> {
  const mapInstancesWithUsersQuery = supabaseClient.from("map_instance").select(`
    *,
    user:user_id (
      name, 
      username,
      id
    )
  `)
  .eq("user_id", userId)
  type MapInstancesWithUsers = QueryData<typeof mapInstancesWithUsersQuery>;
  const { data, error } = await mapInstancesWithUsersQuery;
  if (error) {
    return { message: error.message, success: false };
  }

  if (!data) {
    return { message: "No Map Instances", success: true };
  }
  const mapInstancesWithUsers: MapInstancesWithUsers = data;

  return { success: true, map_instances: mapInstancesWithUsers };
}

export async function getUser(userId: string): Promise<SimpleUserResponse> {
  const { data, error } = await supabaseClient.from("user").select(`id, name, username`).eq('id', userId).single();
  if (error) {
    return { message: error.message, success: false };
  }

  if (!data) {
    return { message: "No Map Instances", success: true };
  }

  return { success: true, user: data }
}
