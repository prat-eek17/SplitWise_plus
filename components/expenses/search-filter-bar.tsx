"use client";

import { Search, X } from "lucide-react";
import { CATEGORY_META, Category, GroupMember } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SearchFilterBar({ members }: { members?: GroupMember[] }) {
  const { filters, setQuery, setCategoryFilter, setMemberFilter, resetFilters } = useAppStore();
  const hasActiveFilters = filters.category !== "all" || filters.memberId !== "all" || filters.query !== "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl2 border border-surface-border bg-surface-raised px-4 py-3">
        <Search size={17} className="text-ink-faint" />
        <input
          value={filters.query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search expenses, groups, members…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        {hasActiveFilters && (
          <button onClick={resetFilters} aria-label="Clear filters">
            <X size={16} className="text-ink-faint" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip
          active={filters.category === "all"}
          onClick={() => setCategoryFilter("all")}
          label="All categories"
        />
        {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
          <Chip
            key={c}
            active={filters.category === c}
            onClick={() => setCategoryFilter(c)}
            label={`${CATEGORY_META[c].emoji} ${CATEGORY_META[c].label}`}
          />
        ))}
      </div>

      {members && members.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip active={filters.memberId === "all"} onClick={() => setMemberFilter("all")} label="Everyone" />
          {members.map((m) => (
            <Chip
              key={m.user_id}
              active={filters.memberId === m.user_id}
              onClick={() => setMemberFilter(m.user_id)}
              label={m.profile?.name ?? "Member"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-brand bg-brand/15 text-brand"
          : "border-surface-border bg-surface text-ink-muted hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}
