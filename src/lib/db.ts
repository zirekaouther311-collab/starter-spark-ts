import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Untyped handle for tables added in supabase/setup.sql (not in generated types.ts)
export const db = supabase as unknown as SupabaseClient;
export const dzd = (n: number) => `${Number(n).toLocaleString("ar-DZ")} دج`;
