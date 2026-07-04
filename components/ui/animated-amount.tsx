"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export function AnimatedAmount({
  value,
  currency = "INR",
  className,
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState("0.00");
  const rounded = useTransform(motionVal, (v) => formatCurrency(v, currency));

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = rounded.on("change", setDisplay);
    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <motion.span className={className}>{display}</motion.span>
  );
}
