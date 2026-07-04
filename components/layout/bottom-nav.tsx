"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PieChart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/analytics", label: "Insights", icon: PieChart },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-30 flex justify-around rounded-t-xl3 pb-safe pt-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-4 py-2 text-xs"
          >
            <Icon
              size={22}
              strokeWidth={active ? 2.4 : 1.8}
              className={cn("transition-colors", active ? "text-brand" : "text-ink-muted")}
            />
            <span className={cn(active ? "text-ink" : "text-ink-faint")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
