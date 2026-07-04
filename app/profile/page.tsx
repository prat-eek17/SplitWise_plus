"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Palette, Coins, Bell, Shield, Download, Trash2, LogOut, type LucideIcon } from "lucide-react";
import { useProfile } from "@/lib/use-profile";
import { useMyGroups } from "@/lib/queries";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/card";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const { data: groups = [] } = useMyGroups();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <main className="min-h-screen pb-32 pt-safe">
      <div className="mx-auto max-w-lg px-5 pt-6">
        {profile && (
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} src={profile.avatar_url} size={64} />
            <div>
              <p className="font-display text-lg font-semibold text-ink">{profile.name}</p>
              <p className="text-sm text-ink-faint">{profile.email}</p>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl2 border border-surface-border bg-surface p-4 text-center">
            <p className="font-display text-xl font-semibold text-ink">{groups.length}</p>
            <p className="text-xs text-ink-faint">Groups joined</p>
          </div>
          <div className="rounded-xl2 border border-surface-border bg-surface p-4 text-center">
            <p className="font-display text-xl font-semibold text-ink">
              {groups.filter((g) => g.created_by === profile?.id).length}
            </p>
            <p className="text-xs text-ink-faint">Groups created</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl2 border border-surface-border bg-surface">
          <SettingsRow icon={Palette} label="Theme" value="System" />
          <SettingsRow icon={Coins} label="Currency" value="INR (₹)" />
          <SettingsRow icon={Bell} label="Notifications" />
          <SettingsRow icon={Shield} label="Privacy" />
          <SettingsRow icon={Download} label="Export data" />
          <SettingsRow icon={Trash2} label="Delete account" danger />
        </div>

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl2 border border-surface-border bg-surface py-3.5 text-sm font-medium text-ink-muted"
        >
          <LogOut size={16} /> Log out
        </button>

        <p className="mt-10 text-center text-xs text-ink-faint">Developed by Prateek ❤️</p>
      </div>
      <BottomNav />
    </main>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  danger?: boolean;
}) {
  return (
    <button className="flex w-full items-center gap-3 border-b border-surface-border px-4 py-3.5 last:border-0">
      <Icon size={17} className={danger ? "text-owe" : "text-ink-muted"} />
      <span className={`flex-1 text-left text-sm ${danger ? "text-owe" : "text-ink"}`}>{label}</span>
      {value && <span className="text-xs text-ink-faint">{value}</span>}
      <ChevronRight size={16} className="text-ink-faint" />
    </button>
  );
}
