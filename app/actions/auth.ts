"use server";
import { supabaseClient } from "@/utils/supabase/client";

export async function usernameExists(username: string): Promise<boolean> {
  const { data, error } = await supabaseClient.from("user").select().eq("username", username).limit(1).single();
  if (error) {
    console.log("Error Retrieving Data", error);
  }
  return data !== null;
}

export async function emailExists(email: string): Promise<boolean> {
  const { data, error } = await supabaseClient.from("user").select().eq("email", email).limit(1).single();
  if (error) {
    console.log("Error Retrieving User", error);
  }
  return data !== null;
}