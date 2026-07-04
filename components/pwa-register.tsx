"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration can legitimately fail in dev/HTTP — safe to ignore.
      });
    }
  }, []);

  return null;
}
