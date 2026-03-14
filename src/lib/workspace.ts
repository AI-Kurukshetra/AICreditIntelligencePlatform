import { redirect } from "next/navigation";
import { getAdminWorkspaceData } from "@/lib/admin-workspace";
import { getDashboardData } from "@/lib/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getWorkspacePageData() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData(supabase, user.id);
  const displayName = data.profile?.full_name || user.user_metadata.full_name || user.email || "User";
  const role = data.profile?.role || "analyst";
  const adminWorkspace = role === "admin" ? await getAdminWorkspaceData() : null;

  return {
    adminWorkspace,
    data,
    displayName,
    role,
    user,
  };
}
