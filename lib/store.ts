import { create } from "zustand";
import { Category } from "./types";

interface FilterState {
  category: Category | "all";
  memberId: string | "all";
  query: string;
}

interface AppState {
  // Add-expense bottom sheet
  isAddExpenseOpen: boolean;
  activeGroupIdForSheet: string | null;
  openAddExpense: (groupId: string) => void;
  closeAddExpense: () => void;

  // Search + filters (shared shape used by both dashboard and group page)
  filters: FilterState;
  setQuery: (query: string) => void;
  setCategoryFilter: (category: Category | "all") => void;
  setMemberFilter: (memberId: string | "all") => void;
  resetFilters: () => void;

  // Currency preference (persisted separately via settings page/localStorage sync)
  currency: string;
  setCurrency: (currency: string) => void;
}

const defaultFilters: FilterState = { category: "all", memberId: "all", query: "" };

export function filterExpenses<T extends { title: string; category: string; notes: string | null; participants?: { user_id: string }[]; paid_by: string }>(
  expenses: T[],
  filters: FilterState
): T[] {
  return expenses.filter((e) => {
    if (filters.category !== "all" && e.category !== filters.category) return false;
    if (
      filters.memberId !== "all" &&
      e.paid_by !== filters.memberId &&
      !(e.participants ?? []).some((p) => p.user_id === filters.memberId)
    )
      return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const haystack = `${e.title} ${e.notes ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export const useAppStore = create<AppState>((set) => ({
  isAddExpenseOpen: false,
  activeGroupIdForSheet: null,
  openAddExpense: (groupId) => set({ isAddExpenseOpen: true, activeGroupIdForSheet: groupId }),
  closeAddExpense: () => set({ isAddExpenseOpen: false, activeGroupIdForSheet: null }),

  filters: defaultFilters,
  setQuery: (query) => set((s) => ({ filters: { ...s.filters, query } })),
  setCategoryFilter: (category) => set((s) => ({ filters: { ...s.filters, category } })),
  setMemberFilter: (memberId) => set((s) => ({ filters: { ...s.filters, memberId } })),
  resetFilters: () => set({ filters: defaultFilters }),

  currency: "INR",
  setCurrency: (currency) => set({ currency }),
}));
