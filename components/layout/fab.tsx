"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-24 right-5 z-30 flex h-15 w-15 items-center justify-center rounded-full bg-brand text-white shadow-glow"
      style={{ height: 60, width: 60 }}
      whileTap={{ scale: 0.88 }}
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      aria-label="Add expense"
    >
      <Plus size={26} strokeWidth={2.4} />
    </motion.button>
  );
}
