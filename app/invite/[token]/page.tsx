"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const supabase = createClient();

  useEffect(() => {
    async function accept() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?next=/invite/${params.token}`);
        return;
      }

      const { data: invite, error } = await supabase
        .from("group_invites")
        .select("*")
        .eq("token", params.token)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !invite) {
        setStatus("error");
        return;
      }

      await supabase.from("group_members").insert({
        group_id: invite.group_id,
        user_id: user.id,
        role: "member",
      });

      await supabase
        .from("group_invites")
        .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
        .eq("id", invite.id);

      await supabase.from("activity_log").insert({
        group_id: invite.group_id,
        actor_id: user.id,
        type: "member_joined",
        message: "A new member joined the group",
      });

      router.replace(`/groups/${invite.group_id}`);
    }
    accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-3xl">🔗</p>
        <p className="mt-3 text-ink">This invite link is invalid or has expired.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-ink-muted">Joining group…</p>
    </main>
  );
}
