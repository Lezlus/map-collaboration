import { supabaseClient } from "../supabase/client"

export const getMapInstnaceQuery = () => {
  return supabaseClient.from('map_instance')
  .select(`
    *,
    user:user_id (
      username,
      name,
      id
    ),
    map:map_id (
      *
    ),
    feature (*)
  `)
};