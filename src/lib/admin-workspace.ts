import type { Tables } from "@/types/database";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type Profile = Tables<"profiles">;
type PendingInvite = Tables<"pending_invites">;

type AdminWorkspaceData = {
  teamMembers: Profile[];
  pendingInvites: PendingInvite[];
};

export async function getAdminWorkspaceData(): Promise<AdminWorkspaceData> {
  const supabase = getSupabaseAdmin();
  const [profilesResult, pendingInvitesResult] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase
      .from("pending_invites")
      .select("*")
      .is("provisioned_at", null)
      .order("created_at", { ascending: false }),
  ]);

  for (const result of [profilesResult, pendingInvitesResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    teamMembers: profilesResult.data ?? [],
    pendingInvites: pendingInvitesResult.data ?? [],
  };
}