import { supabase } from './supabase_BytQILit.mjs';

async function getSoundProfiles() {
  const { data, error } = await supabase.from("sound_profiles").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching sound profiles:", error);
    throw error;
  }
  return data || [];
}

export { getSoundProfiles as g };
