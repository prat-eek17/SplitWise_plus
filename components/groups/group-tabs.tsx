"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const TABS = ["Timeline", "Settle up", "Activity"] as const;
export type GroupTab = (typeof TABS)[number];

export function GroupTabs({ active, onChange }: { active: GroupTab; onChange: (t: GroupTab) => void }) {
  return (
    <div className="flex gap-1 rounded-full border border-surface-border bg-surface p-1">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "relative flex-1 rounded-full py-2 text-xs font-medium transition-colors",
            active === tab ? "text-white" : "text-ink-muted"
          )}
        >
          {active === tab && (
            <motion.div
              layoutId="group-tab-pill"
              className="absolute inset-0 rounded-full bg-brand"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative z-10">{tab}</span>
        </button>
      ))}
    </div>
  );
}
