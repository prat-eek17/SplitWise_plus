"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BottomSheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const EMOJIS = ["🏠", "🍕", "✈️", "🏏", "💻", "🎉", "🛒", "💸"];

export function CreateGroupSheet({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name: name.trim(), emoji, created_by: userId })
      .select()
      .single();

    if (!error && group) {
      await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: userId,
        role: "owner",
      });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setName("");
      onOpenChange(false);
    }
    setLoading(false);
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="New group">
      <div className="space-y-5 pb-2">
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl2 text-xl transition-all ${
                emoji === e ? "bg-brand/20 ring-2 ring-brand" : "bg-surface-raised"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          autoFocus
          placeholder="e.g. Goa Trip"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl2 border border-surface-border bg-surface-raised px-4 py-3.5 text-ink outline-none placeholder:text-ink-faint focus:border-brand"
        />
        <Button size="lg" className="w-full" disabled={!name.trim() || loading} onClick={handleCreate}>
          {loading ? "Creating…" : "Create group"}
        </Button>
      </div>
    </BottomSheet>
  );
}
