"use client";

import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-xl3 border-t border-surface-border bg-surface pb-safe"
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-surface-border" />
          <div className="flex items-center justify-between px-6 pb-2 pt-4">
            <Drawer.Title className="font-display text-lg text-ink">{title}</Drawer.Title>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
