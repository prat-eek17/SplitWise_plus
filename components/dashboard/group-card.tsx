"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Group } from "@/lib/types";

export function GroupCard({ group, index }: { group: Group; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href={`/groups/${group.id}`}
        className="flex items-center gap-3 rounded-xl2 border border-surface-border bg-surface p-4 transition-colors hover:bg-surface-raised"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl2 bg-brand/15 text-xl">
          {group.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{group.name}</p>
          <p className="text-xs text-ink-faint">Tap to view balances</p>
        </div>
        <ChevronRight size={18} className="text-ink-faint" />
      </Link>
    </motion.div>
  );
}
