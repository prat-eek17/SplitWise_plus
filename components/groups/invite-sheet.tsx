"use client";

import { useState } from "react";
import { Link2, Mail, Check } from "lucide-react";
import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function InviteSheet({
  open,
  onOpenChange,
  groupId,
  userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupId: string;
  userId: string;
}) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function generateLink() {
    const { data, error } = await supabase
      .from("group_invites")
      .insert({ group_id: groupId, created_by: userId })
      .select()
      .single();
    if (!error && data) {
      setLink(`${location.origin}/invite/${data.token}`);
    }
  }

  async function sendEmailInvite() {
    if (!email.trim()) return;
    const { error } = await supabase
      .from("group_invites")
      .insert({ group_id: groupId, created_by: userId, email: email.trim() });
    if (!error) setSent(true);
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Invite members">
      <div className="space-y-5 pb-4">
        <div>
          <p className="mb-2 text-xs font-medium text-ink-muted">Shareable link</p>
          {link ? (
            <div className="flex items-center gap-2 rounded-xl2 border border-surface-border bg-surface-raised px-4 py-3">
              <Link2 size={16} className="shrink-0 text-ink-faint" />
              <span className="flex-1 truncate text-sm text-ink-muted">{link}</span>
              <button onClick={copyLink} className="text-xs font-medium text-brand">
                {copied ? <Check size={15} /> : "Copy"}
              </button>
            </div>
          ) : (
            <Button variant="secondary" size="lg" className="w-full" onClick={generateLink}>
              <Link2 size={16} /> Generate invite link
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-ink-faint">
          <div className="h-px flex-1 bg-surface-border" />
          or invite by email
          <div className="h-px flex-1 bg-surface-border" />
        </div>

        {sent ? (
          <p className="rounded-xl2 border border-owed/30 bg-owed-soft p-4 text-center text-sm text-owed">
            Invite sent to {email}.
          </p>
        ) : (
          <div className="flex items-center gap-2 rounded-xl2 border border-surface-border bg-surface-raised px-4 py-3">
            <Mail size={16} className="text-ink-faint" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
            />
            <button onClick={sendEmailInvite} className="text-xs font-medium text-brand">
              Send
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
