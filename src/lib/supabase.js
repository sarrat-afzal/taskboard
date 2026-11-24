import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configError =
  !url || !anonKey
    ? "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in."
    : null;

// Only the public anon key is used in the browser. Row Level Security in the
// database is what keeps each guest's data private.
export const supabase = configError ? null : createClient(url, anonKey);
