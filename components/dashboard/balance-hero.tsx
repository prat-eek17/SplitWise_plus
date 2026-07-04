"use client";

import { motion } from "framer-motion";
import { AnimatedAmount } from "@/components/ui/animated-amount";

export function BalanceHero({
  name,
  youOwe,
  youAreOwed,
  monthlySpend,
}: {
  name: string;
  youOwe: number;
  youAreOwed: number;
  monthlySpend: number;
}) {
  const net = youAreOwed - youOwe;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl3 border border-surface-border bg-gradient-to-br from-surface-raised to-surface p-6 shadow-card"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
      <p className="text-sm text-ink-muted">
        {greeting}, {name.split(" ")[0]}
      </p>
      <p className="mt-3 font-amount font-display text-4xl font-semibold text-ink">
        <AnimatedAmount value={net} />
      </p>
      <p className={`mt-1 text-sm ${net >= 0 ? "text-owed" : "text-owe"}`}>
        {net >= 0 ? "You're net owed overall" : "You owe overall"}
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="You owe" value={youOwe} tone="owe" />
        <Stat label="You're owed" value={youAreOwed} tone="owed" />
        <Stat label="This month" value={monthlySpend} tone="neutral" />
      </div>
    </motion.div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "owe" | "owed" | "neutral" }) {
  const color = tone === "owe" ? "text-owe" : tone === "owed" ? "text-owed" : "text-ink";
  return (
    <div className="rounded-xl2 bg-surface/60 p-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-1 font-amount font-display text-base font-medium ${color}`}>
        <AnimatedAmount value={value} />
      </p>
    </div>
  );
}
