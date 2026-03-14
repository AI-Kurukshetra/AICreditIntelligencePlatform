import { cache } from "react";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const isBootstrapOpen = cache(async () => {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase.from("profiles").select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) === 0;
});